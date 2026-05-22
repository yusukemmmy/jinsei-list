import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleChatRequest } from './chatHandler.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const result = await handleChatRequest(req.headers.authorization, req.body)
  return res.status(result.status).json(result.body)
}
