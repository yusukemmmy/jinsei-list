import { useMemo, useState } from 'react'
import type { Category, Item } from '../types/item'
import { CATEGORIES, getCategoryMeta } from '../constants/categories'
import {
  ARCHIVABLE_CATEGORIES,
  formatArchiveDate,
  formatArchiveMonth,
  groupArchivedByDate,
  isArchived,
} from '../lib/archiveItems'

interface ArchiveViewProps {
  items: Item[]
  onUpdate: (id: string, updates: Partial<Item>) => Promise<{ error?: string } | void>
  onDelete: (id: string) => Promise<void>
  onBack: () => void
}

export function ArchiveView({ items, onUpdate, onDelete, onBack }: ArchiveViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')

  const archivedItems = useMemo(() => items.filter(isArchived), [items])

  const filtered = useMemo(() => {
    if (selectedCategory === 'all') return archivedItems
    return archivedItems.filter((item) => item.category === selectedCategory)
  }, [archivedItems, selectedCategory])

  const grouped = useMemo(() => groupArchivedByDate(filtered), [filtered])

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: archivedItems.length }
    archivedItems.forEach((item) => {
      map[item.category] = (map[item.category] ?? 0) + 1
    })
    return map
  }, [archivedItems])

  let lastMonth = ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">アーカイブ</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            完了した「やってみよう」「イベント」「夢」を日付順に振り返れます
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer shrink-0"
        >
          ← リストへ
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={selectedCategory === 'all'}
          onClick={() => setSelectedCategory('all')}
        >
          すべて {counts.all ?? 0}
        </FilterChip>
        {CATEGORIES.filter((c) => ARCHIVABLE_CATEGORIES.includes(c.value)).map(({ value, label, bg, color }) => (
          <FilterChip
            key={value}
            active={selectedCategory === value}
            onClick={() => setSelectedCategory(value)}
            className={selectedCategory === value ? `${bg} ${color}` : ''}
          >
            {label} {counts[value] ?? 0}
          </FilterChip>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--color-text-muted)]">
            {archivedItems.length === 0
              ? 'まだアーカイブされたアイテムはありません。'
              : 'フィルタに一致するアーカイブがありません。'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ date, items: dayItems }) => {
            const month = formatArchiveMonth(date)
            const showMonthHeader = month !== lastMonth
            lastMonth = month

            return (
              <div key={date} className="space-y-3">
                {showMonthHeader && (
                  <h3 className="text-xs font-medium text-[var(--color-text-muted)] tracking-wide">
                    {month}
                  </h3>
                )}
                <section className="space-y-2">
                  <h4 className="text-sm font-medium text-[var(--color-text)]">
                    {formatArchiveDate(date)}
                    <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">
                      {dayItems.length} 件
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {dayItems.map((item) => (
                      <ArchiveItemCard
                        key={item.id}
                        item={item}
                        onRestore={() => onUpdate(item.id, { status: 'todo' })}
                        onDelete={() => {
                          if (confirm('削除しますか？')) onDelete(item.id)
                        }}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ArchiveItemCard({
  item,
  onRestore,
  onDelete,
}: {
  item: Item
  onRestore: () => void
  onDelete: () => void
}) {
  const meta = getCategoryMeta(item.category)

  return (
    <article className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          <h3 className="font-medium leading-snug text-[var(--color-text-muted)]">{item.title}</h3>
          {item.note && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)] leading-relaxed">{item.note}</p>
          )}
          {item.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span key={tag} className="text-xs text-[var(--color-text-muted)]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={onRestore}
            className="text-xs px-2 py-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
          >
            復元
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs px-2 py-1 rounded text-[var(--color-text-muted)] hover:text-red-600 cursor-pointer"
          >
            削除
          </button>
        </div>
      </div>
    </article>
  )
}

function FilterChip({
  children,
  active,
  onClick,
  className = '',
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer ${
        active
          ? className || 'bg-[var(--color-text)] text-white border-[var(--color-text)]'
          : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-gray-400 bg-white'
      }`}
    >
      {children}
    </button>
  )
}
