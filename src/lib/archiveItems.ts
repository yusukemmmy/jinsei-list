import type { Item, ItemKind, ItemUpdate } from '../types/item'

export const ARCHIVABLE_KINDS: ItemKind[] = ['try', 'dream']
export const DISPOSABLE_KINDS: ItemKind[] = ['must']

export function isArchivableKind(kind: ItemKind): boolean {
  return ARCHIVABLE_KINDS.includes(kind)
}

export function isDisposableKind(kind: ItemKind): boolean {
  return DISPOSABLE_KINDS.includes(kind)
}

export function isArchived(item: Item): boolean {
  return item.status === 'done' && !isPendingDisposal(item)
}

export function isPendingDisposal(item: Item): boolean {
  return isDisposableKind(item.kind) && item.status === 'done' && item.completed_at == null
}

export function isHiddenFromList(item: Item): boolean {
  return isArchived(item) || isPendingDisposal(item)
}

export function getArchiveDate(item: Item): string {
  return (item.completed_at ?? item.updated_at).slice(0, 10)
}

export function applyArchiveUpdates(item: Item | undefined, updates: ItemUpdate): ItemUpdate {
  if (!item || updates.status === undefined) return updates

  if (updates.status === 'done' && isArchivableKind(item.kind)) {
    return { ...updates, completed_at: new Date().toISOString() }
  }

  if (updates.status !== 'done') {
    return { ...updates, completed_at: null }
  }

  return updates
}

export function groupArchivedByDate(items: Item[]): { date: string; items: Item[] }[] {
  const groups = new Map<string, Item[]>()

  const sorted = [...items].sort((a, b) => getArchiveDate(b).localeCompare(getArchiveDate(a)))

  for (const item of sorted) {
    const date = getArchiveDate(item)
    const list = groups.get(date) ?? []
    list.push(item)
    groups.set(date, list)
  }

  return Array.from(groups.entries()).map(([date, groupItems]) => ({ date, items: groupItems }))
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

export function formatArchiveDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()]
  return `${year}年${month}月${day}日（${weekday}）`
}

export function formatArchiveMonth(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number)
  return `${year}年${month}月`
}
