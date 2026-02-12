'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/lib/socket/provider'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { RoomSettings } from '@/types/game'

interface CreateRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoomDialog({ open, onOpenChange }: CreateRoomDialogProps) {
  const t = useTranslations()
  const router = useRouter()
  const { socket } = useSocket()

  const [roomName, setRoomName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('4')
  const [turnTimer, setTurnTimer] = useState('60')
  const [afkThreshold, setAfkThreshold] = useState('3')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!socket) {
      toast.error('Keine Verbindung zum Server')
      return
    }

    // Validate room name
    if (roomName.length < 3 || roomName.length > 30) {
      toast.error('Raumname muss 3-30 Zeichen lang sein')
      return
    }

    setIsCreating(true)

    const settings: RoomSettings = {
      name: roomName.trim(),
      maxPlayers: parseInt(maxPlayers, 10),
      isPrivate,
      turnTimer: parseInt(turnTimer, 10),
      afkThreshold: parseInt(afkThreshold, 10),
      isBetRoom: false, // Default to free room for now, will be updated in Task 2
    }

    socket.emit('room:create', settings, (response: { success: boolean; roomId?: string; error?: string }) => {
      setIsCreating(false)

      if (response.success && response.roomId) {
        toast.success('Raum erfolgreich erstellt')
        onOpenChange(false)
        // Reset form
        setRoomName('')
        setMaxPlayers('4')
        setTurnTimer('60')
        setAfkThreshold('3')
        setIsPrivate(false)
        // Navigate to game room
        router.push(`/game/${response.roomId}`)
      } else {
        toast.error(response.error || 'Fehler beim Erstellen des Raums')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">{t('room.create')}</DialogTitle>
            <DialogDescription>
              Erstelle einen neuen Spielraum und lade Freunde ein.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Room Name */}
            <div className="space-y-2">
              <Label htmlFor="roomName" className="text-white">
                {t('room.roomName')}
              </Label>
              <Input
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Mein Spielraum"
                required
                minLength={3}
                maxLength={30}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Max Players */}
            <div className="space-y-2">
              <Label htmlFor="maxPlayers" className="text-white">
                {t('room.maxPlayers')}
              </Label>
              <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                <SelectTrigger id="maxPlayers" className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Spieler</SelectItem>
                  <SelectItem value="3">3 Spieler</SelectItem>
                  <SelectItem value="4">4 Spieler</SelectItem>
                  <SelectItem value="5">5 Spieler</SelectItem>
                  <SelectItem value="6">6 Spieler</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Turn Timer */}
            <div className="space-y-2">
              <Label htmlFor="turnTimer" className="text-white">
                {t('room.turnTimer')}
              </Label>
              <Select value={turnTimer} onValueChange={setTurnTimer}>
                <SelectTrigger id="turnTimer" className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Sekunden</SelectItem>
                  <SelectItem value="60">60 Sekunden</SelectItem>
                  <SelectItem value="90">90 Sekunden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AFK Threshold */}
            <div className="space-y-2">
              <Label htmlFor="afkThreshold" className="text-white">
                {t('room.afkThreshold')}
              </Label>
              <Input
                id="afkThreshold"
                type="number"
                value={afkThreshold}
                onChange={(e) => setAfkThreshold(e.target.value)}
                min={1}
                max={10}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-xs text-gray-400">
                Spieler werden nach dieser Anzahl inaktiver Runden gekickt
              </p>
            </div>

            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="visibility" className="text-white">
                Sichtbarkeit
              </Label>
              <div className="flex gap-2">
                <Badge
                  variant={!isPrivate ? 'default' : 'outline'}
                  className={`cursor-pointer ${!isPrivate ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-zinc-800'}`}
                  onClick={() => setIsPrivate(false)}
                >
                  {t('room.public')}
                </Badge>
                <Badge
                  variant={isPrivate ? 'default' : 'outline'}
                  className={`cursor-pointer ${isPrivate ? 'bg-yellow-500 hover:bg-yellow-600' : 'hover:bg-zinc-800'}`}
                  onClick={() => setIsPrivate(true)}
                >
                  {t('room.private')}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !roomName.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreating ? t('common.loading') : t('room.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
