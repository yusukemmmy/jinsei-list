import type { ItemKind } from '../types/item'

export const ITEM_KINDS: { value: ItemKind; label: string; color: string; bg: string }[] = [
  { value: 'must', label: 'やらなきゃ', color: 'text-red-700', bg: 'bg-red-50' },
  { value: 'try', label: 'やってみよう', color: 'text-[var(--color-self)]', bg: 'bg-[var(--color-self-bg)]' },
  { value: 'dream', label: '夢', color: 'text-[var(--color-dream)]', bg: 'bg-[var(--color-dream-bg)]' },
]

export function getKindMeta(kind: ItemKind) {
  return ITEM_KINDS.find((k) => k.value === kind)!
}

export function getKindLabel(kind: ItemKind) {
  return getKindMeta(kind).label
}
