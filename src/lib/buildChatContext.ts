import { getCategoryMeta, getStatusLabel } from '../constants/categories'
import { getKindLabel } from '../constants/kinds'
import { getUrgencyLabel } from '../constants/urgency'
import type { Item } from '../types/item'

export function buildChatContext(items: Item[]): string {
  const active = items.filter((item) => item.status !== 'done')

  if (active.length === 0) {
    return '未完了のアイテムはありません。'
  }

  return active
    .map((item) => {
      const kind = getKindLabel(item.kind)
      const category = getCategoryMeta(item.category).label
      const status = getStatusLabel(item.status)
      const urgency = item.urgency ? getUrgencyLabel(item.urgency) : '未設定'
      const deadline = item.deadline ?? 'なし'
      const tags = item.tags.length > 0 ? item.tags.join(', ') : 'なし'
      const note = item.note ? ` / メモ: ${item.note}` : ''

      return `- 「${item.title}」[${kind} / ${category}] ステータス:${status} 緊急度:${urgency} 期限:${deadline} タグ:${tags}${note}`
    })
    .join('\n')
}
