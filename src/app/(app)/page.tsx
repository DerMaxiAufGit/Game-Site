'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/lib/socket/provider'
import { RoomInfo } from '@/types/game'
import { RoomCard } from '@/components/lobby/room-card'
import { LobbyHeader } from '@/components/lobby/lobby-header'
import { CreateRoomDialog } from '@/components/lobby/create-room-dialog'
import { Gamepad2, Coins } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function LobbyPage() {
  const t = useTranslations()
  const router = useRouter()
  const { socket, isConnected, userId } = useSocket()

  const [rooms, setRooms] = useState<RoomInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'bet'>('all')

  // Fetch room list on mount and when rooms update
  useEffect(() => {
    if (!socket || !isConnected) return

    const fetchRooms = () => {
      socket.emit('room:list', (response: { success: boolean; rooms?: RoomInfo[]; error?: string }) => {
        setIsLoading(false)
        if (response.success && response.rooms) {
          setRooms(response.rooms)
        } else {
          console.error('Failed to fetch rooms:', response.error)
          toast.error('Fehler beim Laden der Räume')
        }
      })
    }

    // Initial fetch
    fetchRooms()

    // Listen for room list updates
    const handleRoomListUpdate = () => {
      fetchRooms()
    }

    socket.on('room:list-update', handleRoomListUpdate)

    return () => {
      socket.off('room:list-update', handleRoomListUpdate)
    }
  }, [socket, isConnected])

  // Handle joining a room
  const handleJoinRoom = (roomId: string) => {
    if (!socket) {
      toast.error('Keine Verbindung zum Server')
      return
    }

    socket.emit('room:join', { roomId }, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        router.push(`/game/${roomId}`)
      } else {
        toast.error(response.error || 'Fehler beim Beitreten')
      }
    })
  }

  // Filter rooms based on active filter
  const filteredRooms = rooms.filter((room) => {
    if (activeFilter === 'free') return !room.isBetRoom
    if (activeFilter === 'bet') return room.isBetRoom
    return true // 'all'
  })

  // Count rooms by type
  const freeRoomsCount = rooms.filter(r => !r.isBetRoom).length
  const betRoomsCount = rooms.filter(r => r.isBetRoom).length

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <LobbyHeader
        roomCount={rooms.length}
        onCreateRoom={() => setCreateDialogOpen(true)}
        isConnected={isConnected}
      />

      {/* Filter tabs */}
      {rooms.length > 0 && (
        <div className="flex gap-2 mb-6">
          <Badge
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            className={`cursor-pointer px-4 py-2 text-sm ${
              activeFilter === 'all'
                ? 'bg-green-500 hover:bg-green-600'
                : 'hover:bg-zinc-800'
            }`}
            onClick={() => setActiveFilter('all')}
          >
            Alle ({rooms.length})
          </Badge>
          <Badge
            variant={activeFilter === 'free' ? 'default' : 'outline'}
            className={`cursor-pointer px-4 py-2 text-sm ${
              activeFilter === 'free'
                ? 'bg-green-500 hover:bg-green-600'
                : 'hover:bg-zinc-800'
            }`}
            onClick={() => setActiveFilter('free')}
          >
            Kostenlos ({freeRoomsCount})
          </Badge>
          <Badge
            variant={activeFilter === 'bet' ? 'default' : 'outline'}
            className={`cursor-pointer px-4 py-2 text-sm flex items-center gap-1 ${
              activeFilter === 'bet'
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'hover:bg-zinc-800'
            }`}
            onClick={() => setActiveFilter('bet')}
          >
            <Coins className="h-3 w-3" />
            Einsatz ({betRoomsCount})
          </Badge>
        </div>
      )}

      {/* Room grid */}
      {filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onJoin={handleJoinRoom}
              currentUserId={userId || ''}
            />
          ))}
        </div>
      ) : rooms.length > 0 ? (
        // Empty filter state
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <p className="text-xl text-white">Keine Räume in dieser Kategorie</p>
            <p className="text-gray-400">Versuche einen anderen Filter</p>
          </div>
        </div>
      ) : (
        // Empty state
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <div className="p-6 bg-green-500/10 rounded-2xl">
                <Gamepad2 className="h-16 w-16 text-green-500" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">{t('room.noRooms')}</h2>
              <p className="text-gray-400 text-lg">
                {t('room.createFirst')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Dialog */}
      <CreateRoomDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
