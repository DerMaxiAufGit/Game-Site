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
import { Coins } from 'lucide-react'
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
  const [isBetRoom, setIsBetRoom] = useState(false)
  const [betAmount, setBetAmount] = useState<number | undefined>(undefined)
  const [minBet, setMinBet] = useState<number | undefined>(undefined)
  const [maxBet, setMaxBet] = useState<number | undefined>(undefined)
  const [useCustomPayout, setUseCustomPayout] = useState(false)
  const [payoutRatios, setPayoutRatios] = useState([
    { position: 1, percentage: 60 },
    { position: 2, percentage: 30 },
    { position: 3, percentage: 10 }
  ])
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

    // Validate bet settings
    if (isBetRoom) {
      if (!betAmount || betAmount <= 0) {
        toast.error('Einsatz muss größer als 0 sein')
        return
      }
      if (minBet && maxBet && minBet > maxBet) {
        toast.error('Minimum-Einsatz kann nicht größer als Maximum-Einsatz sein')
        return
      }
      if (minBet && betAmount < minBet) {
        toast.error('Einsatz kann nicht kleiner als Minimum-Einsatz sein')
        return
      }
      if (maxBet && betAmount > maxBet) {
        toast.error('Einsatz kann nicht größer als Maximum-Einsatz sein')
        return
      }
    }

    // Validate custom payout ratios
    if (isBetRoom && useCustomPayout) {
      const sum = payoutRatios.reduce((acc, r) => acc + r.percentage, 0)
      if (sum !== 100) {
        toast.error('Auszahlungsanteile müssen insgesamt 100% ergeben')
        return
      }
    }

    setIsCreating(true)

    const settings: RoomSettings = {
      name: roomName.trim(),
      maxPlayers: parseInt(maxPlayers, 10),
      isPrivate,
      turnTimer: parseInt(turnTimer, 10),
      afkThreshold: parseInt(afkThreshold, 10),
      isBetRoom,
      betAmount: isBetRoom ? betAmount : undefined,
      minBet: isBetRoom && minBet ? minBet : undefined,
      maxBet: isBetRoom && maxBet ? maxBet : undefined,
      payoutRatios: isBetRoom && useCustomPayout ? payoutRatios : undefined
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
        setIsBetRoom(false)
        setBetAmount(undefined)
        setMinBet(undefined)
        setMaxBet(undefined)
        setUseCustomPayout(false)
        setPayoutRatios([
          { position: 1, percentage: 60 },
          { position: 2, percentage: 30 },
          { position: 3, percentage: 10 }
        ])
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

            {/* Free/Bet Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="betType" className="text-white">
                Spielmodus
              </Label>
              <div className="flex gap-2">
                <Badge
                  variant={!isBetRoom ? 'default' : 'outline'}
                  className={`cursor-pointer ${!isBetRoom ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-zinc-800'}`}
                  onClick={() => setIsBetRoom(false)}
                >
                  Kostenlos
                </Badge>
                <Badge
                  variant={isBetRoom ? 'default' : 'outline'}
                  className={`cursor-pointer flex items-center gap-1 ${isBetRoom ? 'bg-amber-500 hover:bg-amber-600' : 'hover:bg-zinc-800'}`}
                  onClick={() => setIsBetRoom(true)}
                >
                  <Coins className="h-3 w-3" />
                  Einsatz
                </Badge>
              </div>
            </div>

            {/* Bet Amount (shown only for bet rooms) */}
            {isBetRoom && (
              <div className="space-y-3 p-4 border border-zinc-800 rounded-lg bg-zinc-800/50">
                <div className="space-y-2">
                  <Label className="text-white">Einsatz pro Spieler</Label>
                  <div className="flex gap-2">
                    {[50, 100, 250, 500].map((preset) => (
                      <Badge
                        key={preset}
                        variant="outline"
                        className={`cursor-pointer px-3 py-1 ${
                          betAmount === preset
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'hover:bg-zinc-700'
                        }`}
                        onClick={() => setBetAmount(preset)}
                      >
                        {preset}
                      </Badge>
                    ))}
                  </div>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      value={betAmount || ''}
                      onChange={(e) => setBetAmount(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      placeholder="Eigener Betrag"
                      min={1}
                      className="bg-zinc-800 border-zinc-700 text-white pl-10"
                    />
                  </div>
                </div>

                {/* Min/Max Bet */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Min. Einsatz</Label>
                    <Input
                      type="number"
                      value={minBet || ''}
                      onChange={(e) => setMinBet(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      placeholder="Kein Minimum"
                      min={0}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Max. Einsatz</Label>
                    <Input
                      type="number"
                      value={maxBet || ''}
                      onChange={(e) => setMaxBet(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      placeholder="Kein Maximum"
                      min={0}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                {/* Payout Ratios */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-white text-sm">Auszahlung</Label>
                    <Badge
                      variant="outline"
                      className="cursor-pointer text-xs"
                      onClick={() => setUseCustomPayout(!useCustomPayout)}
                    >
                      {useCustomPayout ? 'Standard verwenden' : 'Benutzerdefiniert'}
                    </Badge>
                  </div>
                  {!useCustomPayout ? (
                    <p className="text-xs text-gray-400">
                      Standard: 60% / 30% / 10%
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {payoutRatios.map((ratio, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-8">{ratio.position}.</span>
                          <Input
                            type="number"
                            value={ratio.percentage}
                            onChange={(e) => {
                              const newRatios = [...payoutRatios]
                              newRatios[idx].percentage = parseInt(e.target.value, 10) || 0
                              setPayoutRatios(newRatios)
                            }}
                            min={0}
                            max={100}
                            className="bg-zinc-800 border-zinc-700 text-white"
                          />
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                      ))}
                      {payoutRatios.reduce((sum, r) => sum + r.percentage, 0) !== 100 && (
                        <p className="text-xs text-red-500">
                          Summe muss 100% ergeben (aktuell: {payoutRatios.reduce((sum, r) => sum + r.percentage, 0)}%)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
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
