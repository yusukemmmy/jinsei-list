import type { Category, Status } from '../types/item'

export const CATEGORIES: { value: Category; label: string; color: string; bg: string }[] = [
  { value: 'work', label: 'タクト', color: 'text-[var(--color-work)]', bg: 'bg-[var(--color-work-bg)]' },
  { value: 'daily', label: '家', color: 'text-[var(--color-daily)]', bg: 'bg-[var(--color-daily-bg)]' },
  { value: 'self', label: '自分', color: 'text-[var(--color-self)]', bg: 'bg-[var(--color-self-bg)]' },
]

export const STATUSES: { value: Status; label: string }[] = [
  { value: 'todo', label: '未着手' },
  { value: 'in_progress', label: '進行中' },
  { value: 'done', label: '完了' },
]

export function getCategoryMeta(category: Category) {
  return CATEGORIES.find((c) => c.value === category)!
}

export function getStatusLabel(status: Status) {
  return STATUSES.find((s) => s.value === status)?.label ?? status
}

export function parseTags(input: string): string[] {
  return input
    .split(/[,、\s]+/)
    .map((t) => t.replace(/^#/, '').trim())
    .filter(Boolean)
}

export function formatTags(tags: string[]): string {
  return tags.map((t) => `#${t}`).join(' ')
}
