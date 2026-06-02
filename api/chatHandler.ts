import { createClient } from '@supabase/supabase-js'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequestBody {
  message?: string
  context?: string
  history?: ChatMessage[]
}

export interface ChatResult {
  status: number
  body: { reply?: string; error?: string }
}

const SYSTEM_PROMPT = `あなたは「人生リスト」アプリのアシスタントです。
ユーザーのリスト（やらなきゃ・やってみよう・夢 × タクト・家・自分）を見て、優先順位の整理や次にやることの提案をします。

ルール:
- 日本語で、簡潔かつ親しみやすく答えてください
- リストにない内容を勝手に追加しないでください
- 期限・緊急度・ステータス・種類・カテゴリを踏まえて判断してください
- 完了済みのアイテムは提案に含めないでください
- 具体的なアイテム名を挙げて提案してください
- 箇条書きを適宜使って読みやすくしてください`

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  return { url, key }
}

export async function handleChatRequest(
  authorization: string | undefined,
  body: ChatRequestBody,
): Promise<ChatResult> {
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

  const { message, context, history } = body

  if (!message?.trim()) {
    return { status: 400, body: { error: 'メッセージを入力してください' } }
  }

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const systemText = `${SYSTEM_PROMPT}\n\n今日の日付: ${today}\n\nユーザーのリスト:\n${context?.trim() || '（未完了のアイテムはありません）'}`

  const contents: { role: string; parts: { text: string }[] }[] = []

  if (Array.isArray(history)) {
    for (const msg of history.slice(-10)) {
      if (!msg.content?.trim()) continue
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content.trim() }],
      })
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: message.trim() }],
  })

  const modelCandidates = [
    process.env.GEMINI_MODEL,
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
  ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index)

  let lastErrorText = ''

  for (const model of modelCandidates) {
    const geminiRes = await callGemini(model, geminiKey, systemText, contents)

    if (geminiRes.ok) {
      const data = (await geminiRes.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[]
      }
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (reply) {
        return { status: 200, body: { reply } }
      }

      lastErrorText = 'empty response'
      continue
    }

    lastErrorText = await geminiRes.text()
    console.error(`Gemini API error (${model}):`, lastErrorText)

    const shouldRetryModel = isRetryableGeminiError(lastErrorText)
    if (!shouldRetryModel) break
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
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    },
  )
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
  if (errorText.includes('"code": 503') || errorText.includes('UNAVAILABLE')) {
    return 'AIが混み合っています。少し待ってからもう一度お試しください。'
  }
  if (errorText.includes('"code": 429') || errorText.includes('RESOURCE_EXHAUSTED')) {
    return 'AIの利用上限に達しました。しばらくしてからお試しください。'
  }
  return 'AIからの応答を取得できませんでした。しばらくしてからお試しください。'
}
