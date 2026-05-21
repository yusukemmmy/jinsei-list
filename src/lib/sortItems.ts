import { URGENCY_ORDER } from '../constants/urgency'
import type { Item, Urgency } from '../types/item'

export function splitAndSortItems(items: Item[]) {
  const withDeadline = items
    .filter((item) => item.deadline)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!))

  const withoutDeadline = items
    .filter((item) => !item.deadline)
    .sort((a, b) => {
      const orderA = URGENCY_ORDER.indexOf((a.urgency ?? 'soon') as Urgency)
      const orderB = URGENCY_ORDER.indexOf((b.urgency ?? 'soon') as Urgency)
      if (orderA !== orderB) return orderA - orderB
      return b.updated_at.localeCompare(a.updated_at)
    })

  return { withDeadline, withoutDeadline }
}
