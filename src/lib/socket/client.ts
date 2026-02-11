import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('getSocket can only be called on the client side')
  }

  if (!socket) {
    socket = io({
      autoConnect: false,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.1,
    })
  }

  return socket
}
