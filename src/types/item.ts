export type Category = 'work' | 'daily' | 'self'
export type ItemKind = 'must' | 'try' | 'dream'
export type Status = 'todo' | 'in_progress' | 'done'
export type Urgency = 'asap' | 'soon' | 'someday' | 'lifetime'

export interface Item {
  id: string
  user_id: string
  title: string
  category: Category
  kind: ItemKind
  tags: string[]
  note: string | null
  status: Status
  urgency: Urgency | null
  deadline: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type ItemInsert = Pick<Item, 'title' | 'category' | 'kind' | 'tags' | 'note' | 'status' | 'urgency' | 'deadline'>
export type ItemUpdate = Partial<ItemInsert & Pick<Item, 'completed_at'>>
