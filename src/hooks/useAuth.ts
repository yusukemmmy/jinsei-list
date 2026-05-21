import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }

    let mounted = true

    const initAuth = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const errorDescription = params.get('error_description')

      if (errorDescription) {
        setAuthError(decodeURIComponent(errorDescription))
        window.history.replaceState({}, '', window.location.pathname)
      }

      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code)
        if (error) {
          setAuthError(error.message)
        }
        window.history.replaceState({}, '', window.location.pathname)
      }

      const { data: { session }, error } = await client.auth.getSession()
      if (error && mounted) {
        setAuthError(error.message)
      }
      if (mounted) {
        setSession(session)
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    if (!supabase) return
    setAuthError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setAuthError(error.message)
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return {
    user: session?.user ?? null as User | null,
    loading,
    authError,
    signInWithGoogle,
    signOut,
  }
}
