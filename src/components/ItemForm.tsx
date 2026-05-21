import { useState } from 'react'
import type { Category, Item, Status, Urgency } from '../types/item'
import { CATEGORIES, STATUSES, getCategoryMeta, getStatusLabel, parseTags, formatTags } from '../constants/categories'
import { URGENCIES, formatDeadline, getUrgencyMeta } from '../constants/urgency'

interface ItemFormData {
  title: string
  category: Category
  tags: string[]
  note: string | null
  status: Status
  urgency: Urgency | null
  deadline: string | null
}

interface ItemFormProps {
  onSubmit: (data: ItemFormData) => Promise<{ error?: string } | void>
  initial?: Item
  onCancel?: () => void
  embedded?: boolean
}

export function ItemForm({ onSubmit, initial, onCancel, embedded = false }: ItemFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [category, setCategory] = useState<Category>(initial?.category ?? 'daily')
  const [tagsInput, setTagsInput] = useState(initial ? formatTags(initial.tags) : '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [status, setStatus] = useState<Status>(initial?.status ?? 'todo')
  const [urgency, setUrgency] = useState<Urgency>(initial?.urgency ?? 'soon')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const hasDeadline = deadline.trim() !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    setFormError(null)
    const result = await onSubmit({
      title: title.trim(),
      category,
      tags: parseTags(tagsInput),
      note: note.trim() || null,
      status,
      urgency: hasDeadline ? null : urgency,
      deadline: hasDeadline ? deadline : null,
    })
    setSubmitting(false)

    if (result?.error) {
      setFormError(result.error)
      return
    }

    if (!initial) {
      setTitle('')
      setTagsInput('')
      setNote('')
      setStatus('todo')
      setUrgency('soon')
      setDeadline('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        embedded
          ? 'space-y-4'
          : 'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 sm:p-5 space-y-4'
      }
    >
      <div>
        <label htmlFor="item-title" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
          タイトル（必須）
        </label>
        <input
          id="item-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 英語の勉強、旅行計画、健康診断"
          className="w-full text-base font-medium bg-[var(--color-surface)] rounded-lg px-3 py-2.5 outline-none border border-[var(--color-border)] focus:border-[var(--color-text-muted)] placeholder:text-[var(--color-text-muted)]/60"
          autoFocus={!initial}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(({ value, label, bg, color }) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              category === value
                ? `${bg} ${color} border-transparent font-medium`
                : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="item-deadline" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
            期限（任意）
          </label>
          <div className="flex items-center gap-2">
            <input
              id="item-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="flex-1 text-sm bg-[var(--color-surface)] rounded-lg px-3 py-2 outline-none border border-[var(--color-border)] focus:border-[var(--color-text-muted)] cursor-pointer"
            />
            {hasDeadline && (
              <button
                type="button"
                onClick={() => setDeadline('')}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] shrink-0 cursor-pointer"
              >
                クリア
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            期限ありのものは「期限あり」に表示されます
          </p>
        </div>

        {!hasDeadline && (
          <div>
            <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
              ゆとり
            </span>
            <div className="flex flex-wrap gap-1.5">
              {URGENCIES.map(({ value, label, bg, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUrgency(value)}
                  className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    urgency === value
                      ? `${bg} ${color} border-transparent font-medium`
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <input
        type="text"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="タグ（例: 健康, 2025, 学習）"
        className="w-full text-sm bg-[var(--color-surface)] rounded-lg px-3 py-2 outline-none border border-transparent focus:border-[var(--color-border)]"
      />

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="メモ（任意）"
        rows={2}
        className="w-full text-sm bg-[var(--color-surface)] rounded-lg px-3 py-2 outline-none border border-transparent focus:border-[var(--color-border)] resize-none"
      />

      <div className="flex items-center justify-between gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="text-sm bg-[var(--color-surface)] rounded-lg px-3 py-2 outline-none border border-[var(--color-border)] cursor-pointer"
        >
          {STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm px-4 py-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            title={!title.trim() ? 'タイトルを入力してください' : undefined}
            className="text-sm px-5 py-2 rounded-lg bg-[var(--color-text)] text-white font-medium disabled:opacity-40 hover:opacity-90 transition-opacity cursor-pointer disabled:cursor-not-allowed"
          >
            {initial ? '更新' : '追加'}
          </button>
        </div>
      </div>

      {!title.trim() && !initial && (
        <p className="text-xs text-[var(--color-text-muted)]">
          タイトルを入力すると「追加」ボタンが押せます
        </p>
      )}

      {formError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {formError}
        </p>
      )}
    </form>
  )
}

function IconEdit() {
  return (
    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20h9" strokeLinecap="round" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 6h18" strokeLinecap="round" />
      <path d="M8 6V4h8v2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6" strokeLinecap="round" />
      <path d="M14 11v6" strokeLinecap="round" />
    </svg>
  )
}

export function ItemCard({
  item,
  onUpdate,
  onDelete,
}: {
  item: Item
  onUpdate: (id: string, updates: Partial<Item>) => Promise<{ error?: string } | void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const meta = getCategoryMeta(item.category)
  const urgencyMeta = item.urgency ? getUrgencyMeta(item.urgency) : null

  if (editing) {
    return (
      <ItemForm
        initial={item}
        onCancel={() => setEditing(false)}
        onSubmit={async (data) => {
          const result = await onUpdate(item.id, data)
          if (!result?.error) setEditing(false)
          return result
        }}
      />
    )
  }

  const cycleStatus = async () => {
    const order: Status[] = ['todo', 'in_progress', 'done']
    const next = order[(order.indexOf(item.status) + 1) % order.length]
    await onUpdate(item.id, { status: next })
  }

  const actionButtons = (
    <>
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
      >
        <IconEdit />
        編集
      </button>
      <button
        onClick={() => {
          if (confirm('削除しますか？')) onDelete(item.id)
        }}
        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-[var(--color-text-muted)] hover:text-red-600 cursor-pointer"
      >
        <IconTrash />
        削除
      </button>
    </>
  )

  return (
    <article className="group relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 sm:p-5">
      <div className="absolute top-4 right-4 z-10 flex gap-1 sm:hidden">
        {actionButtons}
      </div>

      <div className="flex items-start gap-3">
        <button
          onClick={cycleStatus}
          title={getStatusLabel(item.status)}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 transition-colors cursor-pointer ${
            item.status === 'done'
              ? 'bg-[var(--color-daily)] border-[var(--color-daily)]'
              : item.status === 'in_progress'
                ? 'border-[var(--color-daily)] bg-[var(--color-daily-bg)]'
                : 'border-[var(--color-border)] hover:border-gray-400'
          }`}
        />

        <div className="flex-1 min-w-0 pr-16 sm:pr-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
            {item.deadline && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                📅 {formatDeadline(item.deadline)}
              </span>
            )}
            {urgencyMeta && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urgencyMeta.bg} ${urgencyMeta.color}`}>
                {urgencyMeta.label}
              </span>
            )}
            <span className="text-xs text-[var(--color-text-muted)]">
              {getStatusLabel(item.status)}
            </span>
          </div>

          <h3 className={`font-medium leading-snug ${item.status === 'done' ? 'line-through text-[var(--color-text-muted)]' : ''}`}>
            {item.title}
          </h3>

          {item.note && (
            <p className="mt-1.5 text-sm text-[var(--color-text-muted)] leading-relaxed">{item.note}</p>
          )}

          {item.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span key={tag} className="text-xs text-[var(--color-text-muted)]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {actionButtons}
        </div>
      </div>
    </article>
  )
}

function ItemSection({
  title,
  items,
  onUpdate,
  onDelete,
}: {
  title: string
  items: Item[]
  onUpdate: (id: string, updates: Partial<Item>) => Promise<{ error?: string } | void>
  onDelete: (id: string) => Promise<void>
}) {
  if (items.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-[var(--color-text-muted)] flex items-center gap-2">
        {title}
        <span className="text-xs font-normal">{items.length} 件</span>
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
      </div>
    </section>
  )
}

export { ItemSection }
