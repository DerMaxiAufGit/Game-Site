import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import pkg from '@next/env'
const { loadEnvConfig } = pkg
import next from 'next'
import { Server } from 'socket.io'
import { jwtVerify } from 'jose'
import { PrismaClient } from '@prisma/client'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

// Load .env and .env.local before accessing env vars
loadEnvConfig(process.cwd())

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()
const prisma = new PrismaClient()

const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not set')
}
const encodedKey = new TextEncoder().encode(SESSION_SECRET)

// Room Manager - in-memory room state
class RoomManager {
  constructor() {
    this.rooms = new Map() // roomId -> room object
    this.userRooms = new Map() // userId -> Set<roomId>
  }

  createRoom(hostId, hostName, settings) {
    const roomId = randomUUID()
    const room = {
      id: roomId,
      name: settings.name,
      hostId,
      hostName,
      gameType: 'kniffel',
      status: 'waiting',
      isPrivate: settings.isPrivate || false,
      maxPlayers: settings.maxPlayers || 6,
      turnTimer: settings.turnTimer || 60,
      afkThreshold: settings.afkThreshold || 3,
      players: [{ userId: hostId, displayName: hostName, isReady: false }],
      spectators: [],
      gameState: null,
      chat: [],
      createdAt: Date.now()
    }
    this.rooms.set(roomId, room)
    this._trackUser(hostId, roomId)
    return room
  }

  joinRoom(roomId, userId, displayName) {
    const room = this.rooms.get(roomId)
    if (!room) return { error: 'Room not found' }

    // Check if already in room
    if (room.players.some(p => p.userId === userId)) {
      return { room, rejoined: true }
    }

    // If game in progress, join as spectator
    if (room.status === 'playing') {
      if (!room.spectators.includes(userId)) {
        room.spectators.push(userId)
      }
      this._trackUser(userId, roomId)
      return { room, spectator: true }
    }

    if (room.players.length >= room.maxPlayers) {
      return { error: 'Room is full' }
    }

    room.players.push({ userId, displayName, isReady: false })
    this._trackUser(userId, roomId)
    return { room }
  }

  leaveRoom(roomId, userId) {
    const room = this.rooms.get(roomId)
    if (!room) return null

    room.players = room.players.filter(p => p.userId !== userId)
    room.spectators = room.spectators.filter(id => id !== userId)
    this._untrackUser(userId, roomId)

    // If host left, assign new host
    if (room.hostId === userId && room.players.length > 0) {
      room.hostId = room.players[0].userId
      room.hostName = room.players[0].displayName
    }

    // Cleanup empty room
    if (room.players.length === 0 && room.spectators.length === 0) {
      this.rooms.delete(roomId)
      return null
    }

    return room
  }

  getRoom(roomId) {
    return this.rooms.get(roomId) || null
  }

  getPublicRooms() {
    return Array.from(this.rooms.values())
      .filter(r => !r.isPrivate && r.status !== 'ended')
      .map(r => ({
        id: r.id,
        name: r.name,
        hostName: r.hostName,
        gameType: r.gameType,
        status: r.status,
        maxPlayers: r.maxPlayers,
        currentPlayers: r.players.length,
        playerNames: r.players.map(p => p.displayName),
        createdAt: r.createdAt
      }))
  }

  getUserRooms(userId) {
    const roomIds = this.userRooms.get(userId) || new Set()
    return Array.from(roomIds).map(id => this.rooms.get(id)).filter(Boolean)
  }

  removeUserFromAllRooms(userId) {
    const roomIds = this.userRooms.get(userId) || new Set()
    const affectedRooms = []
    for (const roomId of roomIds) {
      const room = this.leaveRoom(roomId, userId)
      if (room) affectedRooms.push(room)
    }
    this.userRooms.delete(userId)
    return affectedRooms
  }

  // Periodic cleanup for stale rooms
  cleanup() {
    const now = Date.now()
    const staleThreshold = 30 * 60 * 1000 // 30 min
    for (const [roomId, room] of this.rooms) {
      if (room.status === 'ended' && (now - room.createdAt) > staleThreshold) {
        this.rooms.delete(roomId)
      }
      if (room.players.length === 0 && room.spectators.length === 0) {
        this.rooms.delete(roomId)
      }
    }
  }

  _trackUser(userId, roomId) {
    if (!this.userRooms.has(userId)) this.userRooms.set(userId, new Set())
    this.userRooms.get(userId).add(roomId)
  }

  _untrackUser(userId, roomId) {
    const rooms = this.userRooms.get(userId)
    if (rooms) {
      rooms.delete(roomId)
      if (rooms.size === 0) this.userRooms.delete(userId)
    }
  }
}

const roomManager = new RoomManager()

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

      // Fetch user from database to get displayName
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { displayName: true }
      })

      if (!user) {
        return next(new Error('User not found'))
      }

      // Store user data in socket
      socket.data.userId = payload.userId
      socket.data.role = payload.role
      socket.data.displayName = user.displayName

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

    // Handle room list request
    socket.on('room:list', (callback) => {
      callback(roomManager.getPublicRooms())
    })

    // Handle room creation
    socket.on('room:create', ({ settings }, callback) => {
      const room = roomManager.createRoom(
        socket.data.userId,
        socket.data.displayName,
        settings
      )
      socket.join(room.id)
      callback({
        roomId: room.id,
        room: roomManager.getPublicRooms().find(r => r.id === room.id)
      })
      // Broadcast updated room list to lobby
      io.emit('room:list-update', roomManager.getPublicRooms())
    })

    // Handle room join
    socket.on('room:join', ({ roomId }, callback) => {
      const result = roomManager.joinRoom(
        roomId,
        socket.data.userId,
        socket.data.displayName
      )
      if (result.error) {
        callback({ error: result.error })
        return
      }
      socket.join(roomId)
      callback({ room: result.room, spectator: result.spectator || false })
      io.to(roomId).emit('room:player-joined', {
        userId: socket.data.userId,
        displayName: socket.data.displayName,
        spectator: result.spectator || false
      })
      io.emit('room:list-update', roomManager.getPublicRooms())
    })

    // Handle room leave
    socket.on('room:leave', ({ roomId }, callback) => {
      const room = roomManager.leaveRoom(roomId, socket.data.userId)
      socket.leave(roomId)
      if (room) {
        io.to(roomId).emit('room:player-left', { userId: socket.data.userId })
        if (room.hostId !== socket.data.userId) {
          io.to(roomId).emit('room:new-host', { hostId: room.hostId })
        }
      }
      io.emit('room:list-update', roomManager.getPublicRooms())
      callback?.({ success: true })
    })

    // Handle player kick
    socket.on('room:kick', ({ roomId, targetUserId }, callback) => {
      const room = roomManager.getRoom(roomId)
      if (!room || room.hostId !== socket.data.userId) {
        callback?.({ error: 'Not host' })
        return
      }
      roomManager.leaveRoom(roomId, targetUserId)
      io.to(roomId).emit('room:player-kicked', { userId: targetUserId })
      io.emit('room:list-update', roomManager.getPublicRooms())
      callback?.({ success: true })
    })

    // Handle state recovery request
    socket.on('request-state', () => {
      console.log(`State recovery requested by ${socket.data.userId}`)
      const userRooms = roomManager.getUserRooms(socket.data.userId)
      if (userRooms.length > 0) {
        const room = userRooms[0] // User's active room
        socket.emit('room:state', { room })
      }
    })

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.data.userId}`)
      const affectedRooms = roomManager.removeUserFromAllRooms(socket.data.userId)
      for (const room of affectedRooms) {
        io.to(room.id).emit('room:player-left', { userId: socket.data.userId })
      }
      io.emit('room:list-update', roomManager.getPublicRooms())
    })
  })

  // Periodic cleanup of stale rooms
  setInterval(() => roomManager.cleanup(), 60000) // Every 60s

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
