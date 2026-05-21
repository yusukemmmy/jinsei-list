import type { Urgency } from '../types/item'

export const URGENCIES: { value: Urgency; label: string; color: string; bg: string }[] = [
  { value: 'asap', label: 'なるはや', color: 'text-red-700', bg: 'bg-red-50' },
  { value: 'soon', label: 'そのうち', color: 'text-amber-700', bg: 'bg-amber-50' },
  { value: 'someday', label: 'いつか', color: 'text-sky-700', bg: 'bg-sky-50' },
  { value: 'lifetime', label: '生きてるうちに', color: 'text-violet-700', bg: 'bg-violet-50' },
]

export const URGENCY_ORDER: Urgency[] = ['asap', 'soon', 'someday', 'lifetime']

export function getUrgencyMeta(urgency: Urgency) {
  return URGENCIES.find((u) => u.value === urgency)!
}

export function getUrgencyLabel(urgency: Urgency) {
  return getUrgencyMeta(urgency).label
}

export function formatDeadline(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })
}
