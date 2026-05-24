import { useEffect, useState } from 'react'
import type { PendingDisposal } from '../hooks/usePendingDisposal'
import { DISPOSAL_UNDO_MS } from '../hooks/usePendingDisposal'

interface UndoToastProps {
  pending: PendingDisposal[]
  onUndo: (id: string) => void
}

export function UndoToast({ pending, onUndo }: UndoToastProps) {
  if (pending.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-30 flex flex-col gap-2 max-w-3xl mx-auto pointer-events-none">
      {pending.map((entry) => (
        <UndoToastItem key={entry.id} entry={entry} onUndo={() => onUndo(entry.id)} />
      ))}
    </div>
  )
}

function UndoToastItem({
  entry,
  onUndo,
}: {
  entry: PendingDisposal
  onUndo: () => void
}) {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, entry.expiresAt - Date.now()))

  useEffect(() => {
    setRemainingMs(Math.max(0, entry.expiresAt - Date.now()))
    const interval = setInterval(() => {
      setRemainingMs(Math.max(0, entry.expiresAt - Date.now()))
    }, 200)
    return () => clearInterval(interval)
  }, [entry.expiresAt])

  const seconds = Math.ceil(remainingMs / 1000)
  const progress = Math.min(100, (remainingMs / DISPOSAL_UNDO_MS) * 100)

  return (
    <div className="pointer-events-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-lg px-4 py-3 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm min-w-0 truncate">
          <span className="text-[var(--color-text-muted)]">完了:</span>{' '}
          <span className="font-medium">{entry.title}</span>
        </p>
        <button
          type="button"
          onClick={onUndo}
          className="text-sm font-medium px-3 py-1.5 rounded-lg bg-[var(--color-text)] text-white hover:opacity-90 transition-opacity cursor-pointer shrink-0"
        >
          元に戻す
        </button>
      </div>
      <div className="mt-2 h-0.5 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full bg-[var(--color-daily)] transition-[width] duration-200 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        {seconds} 秒後に削除されます
      </p>
    </div>
  )
}
