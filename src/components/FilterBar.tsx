import type { Category } from '../types/item'
import { CATEGORIES } from '../constants/categories'

interface FilterBarProps {
  selectedCategory: Category | 'all'
  selectedTag: string | null
  allTags: string[]
  onCategoryChange: (category: Category | 'all') => void
  onTagChange: (tag: string | null) => void
}

export function FilterBar({
  selectedCategory,
  selectedTag,
  allTags,
  onCategoryChange,
  onTagChange,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
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

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button
              key={tag}
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
