import { useEffect, useRef, useState } from 'react'
import { QUICK_QUESTIONS, type ChatMessage } from '../types/chat'

interface ChatPanelProps {
  open: boolean
  onClose: () => void
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  onSend: (text: string) => void
  onClearError: () => void
}

export function ChatPanel({
  open,
  onClose,
  messages,
  loading,
  error,
  onSend,
  onClearError,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isComposingRef = useRef(false)
  const lastCompositionEndRef = useRef(0)

  const submitInput = () => {
    if (!input.trim() || loading) return
    onSend(input)
    setInput('')
  }

  const isImeEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) {
      return true
    }
    // macOS: 変換確定の Enter が compositionend の直後に来ることがある
    return Date.now() - lastCompositionEndRef.current < 50
  }

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, error])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitInput()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isImeEnter(e)) return
      e.preventDefault()
      submitInput()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[380px] sm:h-[min(640px,calc(100dvh-2rem))]">
      <button
        type="button"
        aria-label="チャットを閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 sm:hidden cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-panel-title"
        className="absolute inset-x-0 bottom-0 top-16 sm:inset-0 flex flex-col rounded-t-2xl sm:rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] shrink-0">
          <div>
            <h2 id="chat-panel-title" className="text-sm font-semibold">
              AIに聞く
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              リストをもとに提案します
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
              例:「今週片付けるべき予定は？」「暇な時間に何からやる？」
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={`${msg.role}-${i}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[var(--color-text)] text-white rounded-br-md'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                考え中…
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 flex items-start justify-between gap-2">
              <span>{error}</span>
              <button
                type="button"
                onClick={onClearError}
                className="shrink-0 text-xs underline cursor-pointer"
              >
                閉じる
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {QUICK_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                disabled={loading}
                onClick={() => onSend(question)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition-colors cursor-pointer disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onCompositionStart={() => { isComposingRef.current = true }}
              onCompositionEnd={() => {
                isComposingRef.current = false
                lastCompositionEndRef.current = Date.now()
              }}
              onKeyDown={handleKeyDown}
              placeholder="質問を入力…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text)]/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-[var(--color-text)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
            >
              送信
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

interface ChatFabProps {
  onClick: () => void
  hidden?: boolean
}

export function ChatFab({ onClick, hidden }: ChatFabProps) {
  if (hidden) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-full bg-[var(--color-dream)] text-white text-sm font-medium shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
    >
      AIに聞く
    </button>
  )
}
