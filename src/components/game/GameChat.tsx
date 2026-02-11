'use client'

import { useState, useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'
import { MessageCircle, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface ChatMessage {
  id: string
  roomId: string
  userId: string
  displayName: string
  content: string
  isSystem: boolean
  timestamp: number
}

interface GameChatProps {
  roomId: string
  socket: Socket
  currentUserId: string
}

export function GameChat({ roomId, socket, currentUserId }: GameChatProps) {
  const t = useTranslations('chat')
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [isConnected, setIsConnected] = useState(socket.connected)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    // Load chat history on mount
    socket.emit('chat:history', { roomId }, (history: ChatMessage[]) => {
      setMessages(history)
      setTimeout(scrollToBottom, 100)
    })

    // Listen for new messages
    const handleMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message])

      // Increment unread count if collapsed
      if (!isExpanded) {
        setUnreadCount((prev) => prev + 1)
      }

      setTimeout(scrollToBottom, 100)
    }

    // Track connection state
    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    socket.on('chat:message', handleMessage)
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    return () => {
      socket.off('chat:message', handleMessage)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
    }
  }, [socket, roomId, isExpanded])

  // Reset unread count when expanded
  useEffect(() => {
    if (isExpanded) {
      setUnreadCount(0)
      setTimeout(scrollToBottom, 100)
    }
  }, [isExpanded])

  const handleSend = () => {
    const trimmed = inputValue.trim()
    if (!trimmed || !isConnected) return

    socket.emit('chat:send', { roomId, content: trimmed }, (response: any) => {
      if (response?.success) {
        setInputValue('')
      }
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  if (!isExpanded) {
    // Collapsed state: small bar at bottom
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex w-full items-center justify-between px-4 py-3 hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">{t('title')}</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </div>
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // Expanded state: drawer
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background shadow-lg h-[40vh] md:h-80 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span className="font-semibold">{t('title')}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              message.isSystem && 'text-muted-foreground italic text-sm'
            )}
          >
            {message.isSystem ? (
              <div>{message.content}</div>
            ) : (
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm">
                    {message.displayName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div className="text-sm">{message.content}</div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.slice(0, 500))}
            onKeyDown={handleKeyPress}
            placeholder={t('placeholder')}
            disabled={!isConnected}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!isConnected || !inputValue.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!isConnected && (
          <p className="text-xs text-muted-foreground mt-2">
            Nicht verbunden...
          </p>
        )}
      </div>
    </div>
  )
}
