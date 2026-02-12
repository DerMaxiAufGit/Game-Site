'use client'

import { Coins } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PotDisplayProps {
  totalPot: number
  currencyName?: string
}

export function PotDisplay({ totalPot, currencyName = 'Chips' }: PotDisplayProps) {
  const [displayPot, setDisplayPot] = useState(totalPot)

  // Animate pot changes
  useEffect(() => {
    if (displayPot !== totalPot) {
      const step = totalPot > displayPot ? 1 : -1
      const duration = 500
      const steps = Math.abs(totalPot - displayPot)
      const interval = duration / Math.max(steps, 1)

      let current = displayPot
      const timer = setInterval(() => {
        current += step
        setDisplayPot(current)
        if (current === totalPot) {
          clearInterval(timer)
        }
      }, interval)

      return () => clearInterval(timer)
    }
  }, [totalPot, displayPot])

  return (
    <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-full px-4 py-2 font-semibold">
      <Coins className="h-5 w-5" />
      <span>Pot: {displayPot} {currencyName}</span>
    </div>
  )
}
