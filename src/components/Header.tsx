import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User
  itemCount: number
  onSignOut: () => void
  onAddClick: () => void
  onChatClick: () => void
}

export function Header({ user, itemCount, onSignOut, onAddClick, onChatClick }: HeaderProps) {
  const avatarUrl = user.user_metadata?.avatar_url
  const name = user.user_metadata?.full_name ?? user.email

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">人生リスト</h1>
          <p className="text-xs text-[var(--color-text-muted)]">{itemCount} 件</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onChatClick}
            className="text-sm px-3 sm:px-4 py-2 rounded-lg bg-[var(--color-dream)] text-white font-medium hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          >
            AIに聞く
          </button>
          <button
            type="button"
            onClick={onAddClick}
            className="text-sm px-3 sm:px-4 py-2 rounded-lg bg-[var(--color-text)] text-white font-medium hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          >
            ＋ 追加
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
