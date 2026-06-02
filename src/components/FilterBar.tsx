import { useState } from 'react'
import type { Category, ItemKind } from '../types/item'
import { CATEGORIES } from '../constants/categories'
import { ITEM_KINDS } from '../constants/kinds'

interface FilterBarProps {
  selectedKind: ItemKind | 'all'
  selectedCategory: Category | 'all'
  selectedTag: string | null
  allTags: string[]
  onKindChange: (kind: ItemKind | 'all') => void
  onCategoryChange: (category: Category | 'all') => void
  onTagChange: (tag: string | null) => void
}

export function FilterBar({
  selectedKind,
  selectedCategory,
  selectedTag,
  allTags,
  onKindChange,
  onCategoryChange,
  onTagChange,
}: FilterBarProps) {
  const [tagsOpen, setTagsOpen] = useState(false)

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5">種類</p>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={selectedKind === 'all'} onClick={() => onKindChange('all')}>
            すべて
          </FilterChip>
          {ITEM_KINDS.map(({ value, label, bg, color }) => (
            <FilterChip
              key={value}
              active={selectedKind === value}
              onClick={() => onKindChange(value)}
              className={selectedKind === value ? `${bg} ${color}` : ''}
            >
              {label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5">カテゴリー</p>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={selectedCategory === 'all'}
            onClick={() => onCategoryChange('all')}
          >
            すべて
          </FilterChip>
          {CATEGORIES.map(({ value, label, bg, color }) => (
            <FilterChip
              key={value}
              active={selectedCategory === value}
              onClick={() => onCategoryChange(value)}
              className={selectedCategory === value ? `${bg} ${color}` : ''}
            >
              {label}
            </FilterChip>
          ))}
        </div>
      </div>

      {allTags.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setTagsOpen((open) => !open)}
            aria-expanded={tagsOpen}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] mb-1.5 cursor-pointer hover:text-[var(--color-text)] transition-colors"
          >
            <span>タグ</span>
            <span className="font-normal">({allTags.length})</span>
            {selectedTag && (
              <span className="font-normal text-[var(--color-text)]">· #{selectedTag}</span>
            )}
            <ChevronIcon open={tagsOpen} />
          </button>
          {tagsOpen && (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagChange(selectedTag === tag ? null : tag)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-[var(--color-text)] text-white border-[var(--color-text)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-gray-400'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
