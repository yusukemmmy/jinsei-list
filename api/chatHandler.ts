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
ユーザーの仕事・日常・イベント・夢のリストを見て、優先順位の整理や次にやることの提案をします。

ルール:
- 日本語で、簡潔かつ親しみやすく答えてください
- リストにない内容を勝手に追加しないでください
- 期限・緊急度・ステータス・カテゴリを踏まえて判断してください
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

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite'
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

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
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

  if (!geminiRes.ok) {
    console.error('Gemini API error:', await geminiRes.text())
    return {
      status: 502,
      body: { error: 'AIからの応答を取得できませんでした。しばらくしてからお試しください。' },
    }
  }

  const data = (await geminiRes.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!reply) {
    return { status: 502, body: { error: 'AIから応答がありませんでした。' } }
  }

  return { status: 200, body: { reply } }
}
