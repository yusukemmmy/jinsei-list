import { supabase } from './supabase'
import type { ChatMessage } from '../types/chat'

export async function sendChatMessage(
  message: string,
  context: string,
  history: ChatMessage[] = [],
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase が設定されていません')
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('ログインが必要です')
  }

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ message, context, history }),
  })

  const data = (await res.json()) as { reply?: string; error?: string }

  if (!res.ok) {
    throw new Error(data.error ?? 'リクエストに失敗しました')
  }

  if (!data.reply) {
    throw new Error('AIから応答がありませんでした')
  }

  return data.reply
}
