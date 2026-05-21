import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Item, ItemInsert, ItemUpdate } from '../types/item'

function friendlyError(message: string): string {
  if (
    message.includes('urgency') ||
    message.includes('deadline') ||
    message.includes('schema cache')
  ) {
    return 'データベースの更新が必要です。Supabase の SQL Editor で supabase/migration_add_urgency_deadline.sql を実行してください。'
  }
  return message
}

export function useItems(userId: string | undefined) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    if (!supabase || !userId) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setItems(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const addItem = async (item: ItemInsert) => {
    if (!supabase || !userId) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('items')
      .insert({ ...item, user_id: userId })
      .select()
      .single()

    if (error) {
      setError(friendlyError(error.message))
      return { error: friendlyError(error.message) }
    }

    if (data) {
      setItems((prev) => [data, ...prev])
      setError(null)
    }
    return { data, error: undefined }
  }

  const updateItem = async (id: string, updates: ItemUpdate) => {
    if (!supabase) return { error: 'Not configured' }

    const { data, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      setError(friendlyError(error.message))
      return { error: friendlyError(error.message) }
    }

    if (data) {
      setItems((prev) => prev.map((i) => (i.id === id ? data : i)))
      setError(null)
    }
    return { data, error: undefined }
  }

  const deleteItem = async (id: string) => {
    if (!supabase) return { error: 'Not configured' }

    const { error } = await supabase.from('items').delete().eq('id', id)

    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== id))
    }
    return { error: error?.message }
  }

  return { items, loading, error, addItem, updateItem, deleteItem, refetch: fetchItems }
}
