import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User
  itemCount: number
  onSignOut: () => void
}

export function Header({ user, itemCount, onSignOut }: HeaderProps) {
  const avatarUrl = user.user_metadata?.avatar_url
  const name = user.user_metadata?.full_name ?? user.email

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">人生リスト</h1>
          <p className="text-xs text-[var(--color-text-muted)]">{itemCount} 件</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {avatarUrl && (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />
            )}
            <span className="text-sm text-[var(--color-text-muted)] truncate max-w-[120px] sm:max-w-none hidden sm:block">
              {name}
            </span>
          </div>
          <button
            onClick={onSignOut}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  )
}
