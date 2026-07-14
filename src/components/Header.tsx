import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User
  itemCount: number
  archivedCount?: number
  onSignOut: () => void
  onAddClick: () => void
  onArchiveClick?: () => void
  showArchiveButton?: boolean
}

export function Header({
  user,
  itemCount,
  archivedCount = 0,
  onSignOut,
  onAddClick,
  onArchiveClick,
  showArchiveButton = true,
}: HeaderProps) {
  const avatarUrl = user.user_metadata?.avatar_url
  const name = user.user_metadata?.full_name ?? user.email
  const archiveLabel = archivedCount > 0 ? `アーカイブ（${archivedCount}件）` : 'アーカイブ'

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">暇つぶしリスト</h1>
          <p className="text-xs text-[var(--color-text-muted)]">{itemCount} 件</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          {showArchiveButton && onArchiveClick && (
            <button
              type="button"
              onClick={onArchiveClick}
              aria-label={archiveLabel}
              className="relative text-sm p-2 sm:px-3 sm:py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer shrink-0"
            >
              <IconArchive className="w-5 h-5 sm:hidden" />
              <span className="hidden sm:inline">
                アーカイブ{archivedCount > 0 ? ` ${archivedCount}` : ''}
              </span>
              {archivedCount > 0 && (
                <span className="sm:hidden absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[var(--color-text)] text-white text-[10px] leading-4 text-center font-medium">
                  {archivedCount}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onAddClick}
            aria-label="追加"
            className="text-sm p-2 sm:px-4 sm:py-2 rounded-lg bg-[var(--color-text)] text-white font-medium hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          >
            <IconPlus className="w-5 h-5 sm:hidden" />
            <span className="hidden sm:inline">＋ 追加</span>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            {avatarUrl && (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />
            )}
            <span className="text-sm text-[var(--color-text-muted)] truncate max-w-[120px] sm:max-w-none hidden sm:block">
              {name}
            </span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="ログアウト"
            className="p-2 sm:p-0 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer shrink-0"
          >
            <IconLogOut className="w-5 h-5 sm:hidden" />
            <span className="hidden sm:inline text-xs">ログアウト</span>
          </button>
        </div>
      </div>
    </header>
  )
}

function IconArchive({ className = 'w-5 h-5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 8v13H3V8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 3h22v5H1V3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12h4" strokeLinecap="round" />
    </svg>
  )
}

function IconPlus({ className = 'w-5 h-5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 5v14" strokeLinecap="round" />
      <path d="M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

function IconLogOut({ className = 'w-5 h-5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12H9" strokeLinecap="round" />
    </svg>
  )
}
