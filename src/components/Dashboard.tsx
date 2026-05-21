import { useMemo, useState } from 'react'
import type { Category, Item, ItemInsert } from '../types/item'
import { splitAndSortItems } from '../lib/sortItems'
import { Header } from './Header'
import { FilterBar } from './FilterBar'
import { Modal } from './Modal'
import { ItemForm, ItemSection } from './ItemForm'
import type { User } from '@supabase/supabase-js'

interface DashboardProps {
  user: User
  items: Item[]
  loading: boolean
  error: string | null
  onSignOut: () => void
  onAdd: (data: ItemInsert) => Promise<{ error?: string } | void>
  onUpdate: (id: string, updates: Partial<Item>) => Promise<{ error?: string } | void>
  onDelete: (id: string) => Promise<void>
}

export function Dashboard({
  user,
  items,
  loading,
  error,
  onSignOut,
  onAdd,
  onUpdate,
  onDelete,
}: DashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    items.forEach((item) => item.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
      if (selectedTag && !item.tags.includes(selectedTag)) return false
      return true
    })
  }, [items, selectedCategory, selectedTag])

  const { withDeadline, withoutDeadline } = useMemo(
    () => splitAndSortItems(filtered),
    [filtered],
  )

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length }
    items.forEach((item) => {
      map[item.category] = (map[item.category] ?? 0) + 1
    })
    return map
  }, [items])

  const hasItems = withDeadline.length > 0 || withoutDeadline.length > 0

  return (
    <div className="min-h-dvh">
      <Header
        user={user}
        itemCount={items.length}
        onSignOut={onSignOut}
        onAddClick={() => setShowAddModal(true)}
      />

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="新規追加">
        <ItemForm
          embedded
          onCancel={() => setShowAddModal(false)}
          onSubmit={async (data) => {
            const result = await onAdd(data)
            if (!result?.error) setShowAddModal(false)
            return result
          }}
        />
      </Modal>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <FilterBar
          selectedCategory={selectedCategory}
          selectedTag={selectedTag}
          allTags={allTags}
          onCategoryChange={setSelectedCategory}
          onTagChange={setSelectedTag}
        />

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center text-[var(--color-text-muted)] py-12">読み込み中…</p>
        ) : !hasItems ? (
          <div className="text-center py-12">
            <p className="text-[var(--color-text-muted)]">
              {items.length === 0
                ? 'まだアイテムがありません。「＋ 追加」ボタンから登録してみましょう。'
                : 'フィルタに一致するアイテムがありません。'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {selectedCategory === 'all' && (
              <p className="text-xs text-[var(--color-text-muted)]">
                {filtered.length} 件表示
                {counts.work ? ` · 仕事 ${counts.work}` : ''}
                {counts.daily ? ` · 日常 ${counts.daily}` : ''}
                {counts.event ? ` · イベント ${counts.event}` : ''}
                {counts.dream ? ` · 夢 ${counts.dream}` : ''}
              </p>
            )}

            <ItemSection
              title="期限あり"
              items={withDeadline}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />

            <ItemSection
              title="期限なし"
              items={withoutDeadline}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          </div>
        )}
      </main>
    </div>
  )
}
