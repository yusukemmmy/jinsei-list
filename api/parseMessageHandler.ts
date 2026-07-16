import { createClient } from '@supabase/supabase-js'

export interface ParseMessageRequestBody {
  text?: string
}

export interface ParsedItemDraft {
  title: string
  note: string
  deadline: string | null
  urgency: 'asap' | 'soon' | 'someday' | 'lifetime' | null
}

export interface ParseMessageResult {
  status: number
  body: Partial<ParsedItemDraft> & { error?: string }
}

const SYSTEM_PROMPT = `あなたはタスク管理アプリ用のアシスタントです。
Chatwork・Slack・メールなどのメッセージ原文から、やるべきタスクを1件抽出します。

ルール:
- 指定スキーマの JSON のみを返す
- title: 何をするか一目で分かる短いタイトル（40文字以内、句点なし）
- note: 要点だけ（依頼の意図・相手の希望など）。原文そのままだら書きは避ける
- note にファイルパス・共有ドライブのパス・長いフォルダ名は書かない
- deadline: 具体日が読み取れるときのみ YYYY-MM-DD。曖昧なら null
  - 「○日のテストアップ」「○日までに」「○日希望」などは deadline にする
  - 「それより早め希望」でも基準日は deadline に入れる
  - 「金曜まで」「来週月曜」「月末」などは今日を基準に換算する
- urgency: deadline があるときは必ず null。日付がなく緊急度だけ分かるときだけ設定
  - asap = 至急・なるはや・今日中・すぐ
  - soon = 近いうち・今週中など
  - 不明なら null
- 引用返信・メンション・日時ヘッダなどのノイズは無視
- タスクが複数あっても最も重要な1件だけ
- 日本語で書く
- 確信がない期限・緊急度は無理に埋めず null にする`

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    note: { type: 'STRING' },
    deadline: { type: 'STRING', nullable: true },
    urgency: {
      type: 'STRING',
      nullable: true,
      enum: ['asap', 'soon', 'someday', 'lifetime'],
    },
  },
  required: ['title', 'note', 'deadline', 'urgency'],
} as const

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  return { url, key }
}

export async function handleParseMessageRequest(
  authorization: string | undefined,
  body: ParseMessageRequestBody,
): Promise<ParseMessageResult> {
  if (!authorization?.startsWith('Bearer ')) {
    return { status: 401, body: { error: 'ログインが必要です' } }
  }

  const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig()
  if (!supabaseUrl || !supabaseAnonKey) {
    return { status: 500, body: { error: 'サーバー設定エラー' } }
  }

  const token = authorization.slice(7)
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { status: 401, body: { error: 'ログインが必要です' } }
  }

  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) {
    return {
      status: 503,
      body: { error: 'AI機能が未設定です。GEMINI_API_KEY を環境変数に設定してください。' },
    }
  }

  const text = body.text?.trim()
  if (!text) {
    return { status: 400, body: { error: 'メッセージを貼り付けてください' } }
  }

  if (text.length > 8000) {
    return { status: 400, body: { error: 'メッセージが長すぎます（8000文字まで）' } }
  }

  const now = new Date()
  const todayIso = formatIsoDate(now)
  const todayJa = now.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Tokyo',
  })

  // Windows パスの \ はモデルの JSON を壊しやすいので、先に / へ正規化する
  const sanitizedText = text.replace(/\\/g, '/')

  const systemText = `${SYSTEM_PROMPT}\n\n今日の日付: ${todayJa}（${todayIso}、タイムゾーン Asia/Tokyo）`
  const contents = [
    {
      role: 'user',
      parts: [{ text: `次のメッセージからタスクを抽出してください:\n\n${sanitizedText}` }],
    },
  ]

  const modelCandidates = [
    process.env.GEMINI_MODEL,
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
  ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index)

  let lastErrorText = ''

  for (const model of modelCandidates) {
    const geminiRes = await callGemini(model, geminiKey, systemText, contents)

    if (geminiRes.ok) {
      let data: {
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
      }
      try {
        data = (await geminiRes.json()) as typeof data
      } catch {
        lastErrorText = 'empty response'
        continue
      }
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (raw) {
        const parsed = parseDraftJson(raw)
        if (parsed) {
          return { status: 200, body: parsed }
        }
        console.error(`Invalid JSON from ${model}:`, raw.slice(0, 500))
        lastErrorText = 'invalid json response'
        continue
      }

      lastErrorText = 'empty response'
      continue
    }

    lastErrorText = await geminiRes.text()
    console.error(`Gemini API error (${model}):`, lastErrorText)

    if (!isRetryableGeminiError(lastErrorText)) break
  }

  return {
    status: 502,
    body: { error: toUserFacingGeminiError(lastErrorText) },
  }
}

async function callGemini(
  model: string,
  apiKey: string,
  systemText: string,
  contents: { role: string; parts: { text: string }[] }[],
) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemText }] },
        contents,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    },
  )
}

function parseDraftJson(raw: string): ParsedItemDraft | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const candidates = [
    cleaned,
    extractFirstJsonObject(cleaned),
    extractFirstJsonObject(repairInvalidEscapes(cleaned)),
  ].filter((value): value is string => Boolean(value))

  for (const candidate of candidates) {
    try {
      const data = JSON.parse(candidate) as {
        title?: unknown
        note?: unknown
        deadline?: unknown
        urgency?: unknown
      }
      const draft = toDraft(data)
      if (draft) return draft
    } catch {
      // try next candidate
    }
  }

  return null
}

function toDraft(data: {
  title?: unknown
  note?: unknown
  deadline?: unknown
  urgency?: unknown
}): ParsedItemDraft | null {
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const note = typeof data.note === 'string' ? data.note.trim() : ''
  if (!title) return null

  const deadline = normalizeDeadline(data.deadline)
  const urgency = deadline ? null : normalizeUrgency(data.urgency)

  return {
    title: title.slice(0, 80),
    note: note.slice(0, 2000),
    deadline,
    urgency,
  }
}

/** 先頭の { から対応する } までを取り、末尾のゴミを捨てる */
function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start < 0) return null

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escape) {
        escape = false
      } else if (ch === '\\') {
        escape = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
    } else if (ch === '{') {
      depth += 1
    } else if (ch === '}') {
      depth -= 1
      if (depth === 0) return text.slice(start, i + 1)
    }
  }

  return null
}

/** JSON 文字列内の不正な \（例: Windows パス）を \\ に直す */
function repairInvalidEscapes(text: string): string {
  let out = ''
  let inString = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (!inString) {
      if (ch === '"') inString = true
      out += ch
      continue
    }

    if (ch === '\\') {
      const next = text[i + 1]
      if (
        next === '"'
        || next === '\\'
        || next === '/'
        || next === 'b'
        || next === 'f'
        || next === 'n'
        || next === 'r'
        || next === 't'
        || next === 'u'
      ) {
        out += ch
      } else {
        out += '\\\\'
      }
      continue
    }

    if (ch === '"') inString = false
    out += ch
  }

  return out
}

function formatIsoDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  return `${year}-${month}-${day}`
}

function normalizeDeadline(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null

  const [y, m, d] = trimmed.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  if (
    date.getUTCFullYear() !== y
    || date.getUTCMonth() !== m - 1
    || date.getUTCDate() !== d
  ) {
    return null
  }
  return trimmed
}

function normalizeUrgency(value: unknown): ParsedItemDraft['urgency'] {
  if (value === 'asap' || value === 'soon' || value === 'someday' || value === 'lifetime') {
    return value
  }
  return null
}

function isRetryableGeminiError(errorText: string) {
  return (
    errorText.includes('"code": 503')
    || errorText.includes('"code": 429')
    || errorText.includes('UNAVAILABLE')
    || errorText.includes('RESOURCE_EXHAUSTED')
  )
}

function toUserFacingGeminiError(errorText: string) {
  if (errorText.includes('invalid json') || errorText.includes('empty response')) {
    return 'AIの回答を読み取れませんでした。もう一度お試しください。'
  }
  if (errorText.includes('"code": 503') || errorText.includes('UNAVAILABLE')) {
    return 'AIが混み合っています。少し待ってからもう一度お試しください。'
  }
  if (errorText.includes('"code": 429') || errorText.includes('RESOURCE_EXHAUSTED')) {
    return 'AIの利用上限に達しました。しばらくしてからお試しください。'
  }
  return 'AIからの応答を取得できませんでした。しばらくしてからお試しください。'
}
