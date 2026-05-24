export type Category = 'work' | 'daily' | 'self' | 'event' | 'dream'
export type Status = 'todo' | 'in_progress' | 'done'
export type Urgency = 'asap' | 'soon' | 'someday' | 'lifetime'

export interface Item {
  id: string
  user_id: string
  title: string
  category: Category
  tags: string[]
  note: string | null
  status: Status
  urgency: Urgency | null
  deadline: string | null
  created_at: string
  updated_at: string
}

export type ItemInsert = Pick<Item, 'title' | 'category' | 'tags' | 'note' | 'status' | 'urgency' | 'deadline'>
export type ItemUpdate = Partial<ItemInsert>
