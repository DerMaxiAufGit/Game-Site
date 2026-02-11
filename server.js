import { createServer } from 'node:http'
import next from 'next'
import { Server } from 'socket.io'
import { jwtVerify } from 'jose'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

// Load SESSION_SECRET from environment
const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not set')
}
const encodedKey = new TextEncoder().encode(SESSION_SECRET)

// Parse cookie string to extract specific cookie value
function parseCookie(cookieString, name) {
  if (!cookieString) return null
  const cookies = cookieString.split(';').map((c) => c.trim())
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=')
    if (key === name) {
      return decodeURIComponent(value)
    }
  }
  return null
}

app.prepare().then(() => {
  const httpServer = createServer(handler)
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? 'http://localhost:3000' : false,
      methods: ['GET', 'POST'],
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    reconnectionAttempts: Infinity,
  })

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie
      const sessionCookie = parseCookie(cookieHeader, 'session')

      if (!sessionCookie) {
        return next(new Error('Authentication required'))
      }

      // Verify JWT
      const { payload } = await jwtVerify(sessionCookie, encodedKey, {
        algorithms: ['HS256'],
      })

      // Store user data in socket
      socket.data.userId = payload.userId
      socket.data.role = payload.role

      next()
    } catch (error) {
      console.error('Socket authentication error:', error.message)
      next(new Error('Authentication required'))
    }
  })

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(
      `Client connected: ${socket.data.userId} (${socket.data.role})`
    )

    // Handle state recovery request (stub for Phase 2)
    socket.on('request-state', () => {
      console.log(`State recovery requested by ${socket.data.userId}`)
      // TODO: Send game state to client (Phase 2)
    })

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.data.userId}`)
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
