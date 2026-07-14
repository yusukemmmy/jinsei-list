import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleChatRequest } from './api/chatHandler'
import { handleParseMessageRequest } from './api/parseMessageHandler'

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      if (!data) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(data))
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

function localApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0]
        if (path !== '/api/chat' && path !== '/api/parse-message') {
          next()
          return
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        Object.assign(process.env, env)

        try {
          const body = await readJsonBody(req)
          const result = path === '/api/parse-message'
            ? await handleParseMessageRequest(
              req.headers.authorization,
              body as Parameters<typeof handleParseMessageRequest>[1],
            )
            : await handleChatRequest(
              req.headers.authorization,
              body as Parameters<typeof handleChatRequest>[1],
            )
          sendJson(res, result.status, result.body)
        } catch (error) {
          console.error('Local API error:', error)
          sendJson(res, 500, { error: 'サーバーエラーが発生しました' })
        }
      })
    },
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), localApiPlugin(env)],
  }
})
