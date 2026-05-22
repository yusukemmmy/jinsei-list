import { useCallback, useState } from 'react'
import { buildChatContext } from '../lib/buildChatContext'
import { sendChatMessage } from '../lib/chatApi'
import type { ChatMessage } from '../types/chat'
import type { Item } from '../types/item'

export function useChat(items: Item[]) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const historyBefore = messages
    const userMessage: ChatMessage = { role: 'user', content: trimmed }

    setMessages((prev) => [...prev, userMessage])
    setLoading(true)
    setError(null)

    try {
      const reply = await sendChatMessage(trimmed, buildChatContext(items), historyBefore)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [items, loading, messages])

  const clearError = useCallback(() => setError(null), [])

  return {
    open,
    setOpen,
    messages,
    loading,
    error,
    send,
    clearError,
  }
}
