import { useAuth } from './hooks/useAuth'
import { useItems } from './hooks/useItems'
import { LoginPage } from './components/LoginPage'
import { Dashboard } from './components/Dashboard'
import { isSupabaseConfigured } from './lib/supabase'

function App() {
  const { user, loading: authLoading, authError, signInWithGoogle, signOut } = useAuth()
  const { items, loading: itemsLoading, error, addItem, updateItem, deleteItem } = useItems(user?.id)

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">読み込み中…</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onSignIn={signInWithGoogle} authError={authError} />
  }

  if (!isSupabaseConfigured) {
    return <LoginPage onSignIn={signInWithGoogle} authError={authError} />
  }

  return (
    <Dashboard
      user={user}
      items={items}
      loading={itemsLoading}
      error={error}
      onSignOut={signOut}
      onAdd={addItem}
      onUpdate={updateItem}
      onDelete={async (id) => { await deleteItem(id) }}
    />
  )
}

export default App
