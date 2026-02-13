'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { useSocket } from '@/lib/socket/provider'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Transaction {
  type: string
  amount: number
  description: string
  createdAt: Date
}

interface BalancePopoverProps {
  children: React.ReactNode
}

export function BalancePopover({ children }: BalancePopoverProps) {
  const { socket } = useSocket()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openPopover = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setIsOpen(true)
  }, [])

  const closePopover = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => setIsOpen(false), 150)
  }, [])

  // Fetch transactions when popover opens
  useEffect(() => {
    if (isOpen && socket) {
      socket.emit('wallet:recent-transactions', (data: Transaction[]) => {
        setTransactions(data || [])
      })
    }
  }, [isOpen, socket])

  // Simple relative time formatting
  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return 'gerade eben'
    if (diffMinutes < 60) return `vor ${diffMinutes} Min.`
    if (diffHours < 24) return `vor ${diffHours} Std.`
    return `vor ${diffDays} Tag(en)`
  }

  // Determine if transaction is credit or debit
  const isCredit = (type: string) => {
    const creditTypes = ['INITIAL', 'DAILY_CLAIM', 'WEEKLY_BONUS', 'GAME_WIN', 'TRANSFER_RECEIVED', 'ADMIN_CREDIT', 'BET_REFUND']
    return creditTypes.includes(type)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild onMouseEnter={openPopover} onMouseLeave={closePopover}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-80 bg-zinc-800 border-zinc-700 p-0"
        onMouseEnter={openPopover}
        onMouseLeave={closePopover}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-4 border-b border-zinc-700">
          <h3 className="text-sm font-semibold text-white">Letzte Transaktionen</h3>
        </div>

        <div className="p-2">
          {transactions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">
              Noch keine Transaktionen
            </div>
          ) : (
            <div className="space-y-1">
              {transactions.map((tx, index) => {
                const credit = isCredit(tx.type)
                const Icon = credit ? ArrowUpCircle : ArrowDownCircle

                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-2 rounded hover:bg-zinc-700/50 transition-colors"
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 mt-0.5 flex-shrink-0',
                        credit ? 'text-green-500' : 'text-red-500'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {tx.description.length > 30
                          ? tx.description.slice(0, 30) + '...'
                          : tx.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatRelativeTime(tx.createdAt)}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'text-sm font-semibold whitespace-nowrap',
                        credit ? 'text-green-500' : 'text-red-500'
                      )}
                    >
                      {credit ? '+' : '-'}{tx.amount.toLocaleString('de-DE')}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-zinc-700">
          <Link
            href="/wallet"
            className="block text-center text-sm text-green-500 hover:text-green-400 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Alle Transaktionen
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
