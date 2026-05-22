export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export const QUICK_QUESTIONS = [
  '今週片付けるべき予定は？',
  '暇な時間に何からやる？',
  '進行中のまま止まってるものは？',
  '夢から1つピックアップして',
] as const
