import { supabase } from './supabase'
import type { Urgency } from '../types/item'

export interface ParsedItemDraft {
  title: string
  note: string
  deadline: string | null
  urgency: Urgency | null
}

export async function parseMessageToDraft(text: string): Promise<ParsedItemDraft> {
  if (!supabase) {
    throw new Error('Supabase が設定されていません')
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('ログインが必要です')
  }

  const res = await fetch('/api/parse-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ text }),
  })

  const data = (await res.json()) as {
    title?: string
    note?: string
    deadline?: string | null
    urgency?: Urgency | null
    error?: string
  }

  if (!res.ok) {
    throw new Error(data.error ?? 'リクエストに失敗しました')
  }

  if (!data.title?.trim()) {
    throw new Error('タイトルを生成できませんでした')
  }

  return {
    title: data.title.trim(),
    note: data.note?.trim() ?? '',
    deadline: data.deadline ?? null,
    urgency: data.urgency ?? null,
  }
}
