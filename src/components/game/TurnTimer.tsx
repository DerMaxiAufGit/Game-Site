'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

interface TurnTimerProps {
  startedAt: number | null
  duration: number
  isCurrentPlayer: boolean
}

export function TurnTimer({ startedAt, duration, isCurrentPlayer }: TurnTimerProps) {
  const t = useTranslations('game')
  const [remainingSeconds, setRemainingSeconds] = useState(duration)

  useEffect(() => {
    if (!startedAt) {
      setRemainingSeconds(duration)
      return
    }

    // Calculate remaining time based on server timestamp
    const calculateRemaining = () => {
      const elapsed = (Date.now() - startedAt) / 1000
      const remaining = Math.max(0, duration - elapsed)
      return Math.ceil(remaining)
    }

    // Initial calculation
    setRemainingSeconds(calculateRemaining())

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateRemaining()
      setRemainingSeconds(remaining)

      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [startedAt, duration])

  if (!startedAt) {
    return null
  }

  const percentage = (remainingSeconds / duration) * 100
  const isWarning = percentage < 30
  const isCritical = percentage < 10

  // Color based on percentage
  let barColor = 'bg-green-500'
  if (isCritical) {
    barColor = 'bg-red-500'
  } else if (isWarning) {
    barColor = 'bg-yellow-500'
  }

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Timer Info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {isCurrentPlayer ? 'Deine Zugzeit' : 'Zugzeit'}
        </span>
        <div className="flex items-center gap-2">
          {isCritical && (
            <span className="text-red-400">
              {t('autoPlayWarning', { seconds: remainingSeconds })}
            </span>
          )}
          <span
            className={`font-mono font-semibold ${
              isCritical
                ? 'text-red-400'
                : isWarning
                  ? 'text-yellow-400'
                  : 'text-green-400'
            }`}
          >
            {remainingSeconds}s
          </span>
        </div>
      </div>
    </div>
  )
}
