'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Socket } from 'socket.io-client'
import { getSocket } from './client'

interface SocketContextValue {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
})

export function useSocket() {
  return useContext(SocketContext)
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Create socket instance
    const socket = getSocket()
    socketRef.current = socket

    // Event handlers
    const onConnect = () => {
      console.log('Socket.IO connected')
      setIsConnected(true)
      // Request state recovery on reconnect (PITFALL 6)
      socket.emit('request-state')
    }

    const onDisconnect = () => {
      console.log('Socket.IO disconnected')
      setIsConnected(false)
    }

    const onReconnect = (attemptNumber: number) => {
      console.log('Socket.IO reconnected after', attemptNumber, 'attempts')
    }

    const onReconnectAttempt = (attemptNumber: number) => {
      console.log('Socket.IO reconnection attempt', attemptNumber)
    }

    const onConnectError = (error: Error) => {
      console.error('Socket.IO connection error:', error.message)
    }

    // Register event handlers
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('reconnect', onReconnect)
    socket.on('reconnect_attempt', onReconnectAttempt)
    socket.on('connect_error', onConnectError)

    // Connect the socket
    socket.connect()

    // Cleanup on unmount
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('reconnect', onReconnect)
      socket.off('reconnect_attempt', onReconnectAttempt)
      socket.off('connect_error', onConnectError)
      socket.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
