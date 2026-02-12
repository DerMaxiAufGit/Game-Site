'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CountUp from 'react-countup'
import { Coins } from 'lucide-react'
import { useSocket } from '@/lib/socket/provider'
import { BalancePopover } from './balance-popover'
import { cn } from '@/lib/utils'

export function BalanceWidget() {
  const { balance, balanceChange, isConnected } = useSocket()
  const [previousBalance, setPreviousBalance] = useState<number | null>(null)
  const [isFlashing, setIsFlashing] = useState(false)
  const [flashType, setFlashType] = useState<'positive' | 'negative'>('positive')

  // Track balance changes for animation
  useEffect(() => {
    if (balance !== null && previousBalance !== null && balance !== previousBalance) {
      const change = balance - previousBalance
      setFlashType(change > 0 ? 'positive' : 'negative')
      setIsFlashing(true)

      // Remove flash animation after 1s
      const timeout = setTimeout(() => setIsFlashing(false), 1000)
      return () => clearTimeout(timeout)
    }

    if (balance !== null) {
      setPreviousBalance(balance)
    }
  }, [balance, previousBalance])

  // Loading skeleton
  if (balance === null || !isConnected) {
    return (
      <div className="bg-zinc-800/50 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-zinc-700 rounded w-20 mb-2" />
        <div className="h-6 bg-zinc-700 rounded w-32" />
      </div>
    )
  }

  return (
    <BalancePopover>
      <Link href="/wallet" className="block">
        <div
          className={cn(
            'bg-zinc-800/50 rounded-lg p-4 transition-all duration-300 hover:bg-zinc-800/70 cursor-pointer border border-transparent hover:border-white/10',
            isFlashing && flashType === 'positive' && 'animate-flash-green',
            isFlashing && flashType === 'negative' && 'animate-flash-red'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Coins className="h-4 w-4 text-green-500" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Guthaben</span>
          </div>
          <div className="flex items-baseline gap-1">
            <CountUp
              start={previousBalance || balance}
              end={balance}
              duration={0.8}
              separator="."
              decimals={0}
              preserveValue={true}
              className="text-2xl font-bold text-white"
            />
            <span className="text-sm text-gray-400 ml-1">Chips</span>
          </div>
        </div>
      </Link>
    </BalancePopover>
  )
}
