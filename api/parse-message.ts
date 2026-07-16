import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleParseMessageRequest } from './parseMessageHandler.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const result = await handleParseMessageRequest(req.headers.authorization, req.body)
    return res.status(result.status).json(result.body)
  } catch (error) {
    console.error('parse-message handler error:', error)
    return res.status(500).json({ error: 'サーバーエラーが発生しました' })
  }
}
