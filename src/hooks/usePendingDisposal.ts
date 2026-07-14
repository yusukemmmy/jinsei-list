import { useCallback, useEffect, useRef, useState } from 'react'
import type { Item, Status } from '../types/item'

export const DISPOSAL_UNDO_MS = 8000

export interface PendingDisposal {
  id: string
  title: string
  previousStatus: Status
  expiresAt: number
}

interface UsePendingDisposalOptions {
  onDelete: (id: string) => Promise<void>
  onUpdate: (id: string, updates: Partial<Item>) => Promise<{ error?: string } | void>
}

export function usePendingDisposal({ onDelete, onUpdate }: UsePendingDisposalOptions) {
  const [pending, setPending] = useState<PendingDisposal[]>([])
  const pendingRef = useRef<PendingDisposal[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    pendingRef.current = pending
  }, [pending])

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const removePending = useCallback((id: string) => {
    clearTimer(id)
    setPending((prev) => prev.filter((p) => p.id !== id))
  }, [clearTimer])

  const scheduleDisposal = useCallback(
    (item: Item, previousStatus: Status) => {
      clearTimer(item.id)

      const expiresAt = Date.now() + DISPOSAL_UNDO_MS
      setPending((prev) => [
        ...prev.filter((p) => p.id !== item.id),
        { id: item.id, title: item.title, previousStatus, expiresAt },
      ])

      const timer = setTimeout(async () => {
        timersRef.current.delete(item.id)
        setPending((prev) => prev.filter((p) => p.id !== item.id))
        await onDelete(item.id)
      }, DISPOSAL_UNDO_MS)

      timersRef.current.set(item.id, timer)
    },
    [clearTimer, onDelete],
  )

  const undoDisposal = useCallback(
    async (id: string) => {
      const entry = pendingRef.current.find((p) => p.id === id)
      if (!entry) return

      clearTimer(id)
      setPending((prev) => prev.filter((p) => p.id !== id))
      await onUpdate(id, { status: entry.previousStatus })
    },
    [clearTimer, onUpdate],
  )

  const archiveDisposal = useCallback(
    async (id: string) => {
      const entry = pendingRef.current.find((p) => p.id === id)
      if (!entry) return

      clearTimer(id)
      setPending((prev) => prev.filter((p) => p.id !== id))
      await onUpdate(id, { completed_at: new Date().toISOString() })
    },
    [clearTimer, onUpdate],
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  return { pending, scheduleDisposal, undoDisposal, archiveDisposal, removePending }
}
