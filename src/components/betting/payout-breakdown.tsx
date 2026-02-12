'use client'

import { Trophy, Medal } from 'lucide-react'

interface PayoutEntry {
  userId: string
  displayName: string
  position: number
  amount: number
}

interface PayoutBreakdownProps {
  payouts: PayoutEntry[]
  currencyName?: string
}

export function PayoutBreakdown({ payouts, currencyName = 'Chips' }: PayoutBreakdownProps) {
  if (!payouts || payouts.length === 0) return null

  const getMedalIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-5 w-5 text-yellow-400" />
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (position === 3) return <Medal className="h-5 w-5 text-orange-600" />
    return null
  }

  const getMedalColor = (position: number) => {
    if (position === 1) return 'text-yellow-400'
    if (position === 2) return 'text-gray-400'
    if (position === 3) return 'text-orange-600'
    return 'text-gray-500'
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <h3 className="mb-4 text-lg font-semibold text-white">Gewinnverteilung</h3>
      <div className="space-y-2">
        {payouts.map((payout) => (
          <div
            key={payout.userId}
            className="flex items-center justify-between rounded-lg bg-gray-900/30 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex w-8 items-center justify-center">
                {getMedalIcon(payout.position) || (
                  <span className={`text-lg font-bold ${getMedalColor(payout.position)}`}>
                    {payout.position}
                  </span>
                )}
              </div>
              <span className="text-white font-medium">{payout.displayName}</span>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-bold text-lg">
                +{payout.amount} {currencyName}
              </p>
              <p className="text-xs text-gray-400">{payout.position}. Platz</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
