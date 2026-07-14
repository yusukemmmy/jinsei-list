import { useCallback, useMemo, useState } from 'react'
import type { Category, Item, ItemInsert, ItemKind } from '../types/item'
import { CATEGORIES } from '../constants/categories'
import { ITEM_KINDS } from '../constants/kinds'
import { isArchived, isDisposableKind, isHiddenFromList } from '../lib/archiveItems'
import { splitAndSortItems } from '../lib/sortItems'
import { Header } from './Header'
import { FilterBar } from './FilterBar'
import { Modal } from './Modal'
import { ItemForm, ItemSection } from './ItemForm'
import { ArchiveView } from './ArchiveView'
import { UndoToast } from './UndoToast'
import { ChatFab, ChatPanel } from './ChatPanel'
import { useChat } from '../hooks/useChat'
import { usePendingDisposal } from '../hooks/usePendingDisposal'
import type { User } from '@supabase/supabase-js'

type View = 'list' | 'archive'

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
  const [selectedKind, setSelectedKind] = useState<ItemKind | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [view, setView] = useState<View>('list')
  const chat = useChat(items)

  const { pending, scheduleDisposal, undoDisposal, archiveDisposal } = usePendingDisposal({
    onDelete,
    onUpdate,
  })

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Item>) => {
      const current = items.find((item) => item.id === id)
      if (
        current &&
        updates.status === 'done' &&
        isDisposableKind(current.kind) &&
        current.status !== 'done'
      ) {
        const result = await onUpdate(id, { status: 'done' })
        if (!result?.error) {
          scheduleDisposal(current, current.status)
        }
        return result
      }

      return onUpdate(id, updates)
    },
    [items, onUpdate, scheduleDisposal],
  )

  const activeItems = useMemo(() => items.filter((item) => !isHiddenFromList(item)), [items])
  const archivedCount = useMemo(() => items.filter(isArchived).length, [items])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    activeItems.forEach((item) => item.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [activeItems])

  const filtered = useMemo(() => {
    return activeItems.filter((item) => {
      if (selectedKind !== 'all' && item.kind !== selectedKind) return false
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
      if (selectedTag && !item.tags.includes(selectedTag)) return false
      return true
    })
  }, [activeItems, selectedKind, selectedCategory, selectedTag])

  const { withDeadline, withoutDeadline } = useMemo(
    () => splitAndSortItems(filtered),
    [filtered],
  )

  const kindCounts = useMemo(() => {
    const map: Record<string, number> = {}
    activeItems.forEach((item) => {
      map[item.kind] = (map[item.kind] ?? 0) + 1
    })
    return map
  }, [activeItems])

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {}
    activeItems.forEach((item) => {
      map[item.category] = (map[item.category] ?? 0) + 1
    })
    return map
  }, [activeItems])

  const hasItems = withDeadline.length > 0 || withoutDeadline.length > 0

  return (
    <div className="min-h-dvh">
      <Header
        user={user}
        itemCount={activeItems.length}
        archivedCount={archivedCount}
        onSignOut={onSignOut}
        onAddClick={() => setShowAddModal(true)}
        onArchiveClick={() => setView('archive')}
        showArchiveButton={view === 'list'}
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
        {view === 'archive' ? (
          <ArchiveView
            items={items}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onBack={() => setView('list')}
          />
        ) : (
          <>
            <FilterBar
              selectedKind={selectedKind}
              selectedCategory={selectedCategory}
              selectedTag={selectedTag}
              allTags={allTags}
              onKindChange={setSelectedKind}
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
                  {activeItems.length === 0
                    ? 'まだアイテムがありません。「＋ 追加」ボタンから登録してみましょう。'
                    : 'フィルタに一致するアイテムがありません。'}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {selectedKind === 'all' && selectedCategory === 'all' && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {filtered.length} 件表示
                    {ITEM_KINDS.filter((k) => kindCounts[k.value]).map(
                      (k) => ` · ${k.label} ${kindCounts[k.value]}`,
                    ).join('')}
                    {CATEGORIES.filter((c) => categoryCounts[c.value]).map(
                      (c) => ` · ${c.label} ${categoryCounts[c.value]}`,
                    ).join('')}
                  </p>
                )}

                <ItemSection
                  title="期限あり"
                  items={withDeadline}
                  onUpdate={handleUpdate}
                  onDelete={onDelete}
                />

                <ItemSection
                  title="期限なし"
                  items={withoutDeadline}
                  onUpdate={handleUpdate}
                  onDelete={onDelete}
                />
              </div>
            )}
          </>
        )}
      </main>

      {view === 'list' && (
        <>
          <UndoToast pending={pending} onUndo={undoDisposal} onArchive={archiveDisposal} />
          <ChatFab onClick={() => chat.setOpen(true)} hidden={chat.open} />
          <ChatPanel
            open={chat.open}
            onClose={() => chat.setOpen(false)}
            messages={chat.messages}
            loading={chat.loading}
            error={chat.error}
            onSend={chat.send}
            onClearError={chat.clearError}
          />
        </>
      )}
    </div>
  )
}
