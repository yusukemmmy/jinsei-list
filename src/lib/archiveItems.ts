import type { Category, Item, ItemUpdate } from '../types/item'

export const ARCHIVABLE_CATEGORIES: Category[] = ['self', 'event', 'dream']

export function isArchivableCategory(category: Category): boolean {
  return ARCHIVABLE_CATEGORIES.includes(category)
}

export function isArchived(item: Item): boolean {
  return isArchivableCategory(item.category) && item.status === 'done'
}

export function getArchiveDate(item: Item): string {
  return (item.completed_at ?? item.updated_at).slice(0, 10)
}

export function applyArchiveUpdates(item: Item | undefined, updates: ItemUpdate): ItemUpdate {
  if (!item || updates.status === undefined) return updates

  if (updates.status === 'done' && isArchivableCategory(item.category)) {
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
