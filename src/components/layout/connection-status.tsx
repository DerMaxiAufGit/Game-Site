'use client'

import { useSocket } from '@/lib/socket/provider'
import { cn } from '@/lib/utils'

export function ConnectionStatus() {
  const { isConnected } = useSocket()

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div
        className={cn(
          'h-2 w-2 rounded-full transition-all duration-300',
          isConnected
            ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse'
            : 'bg-gray-500'
        )}
      />
      <span
        className={cn(
          'text-xs font-medium transition-colors duration-300',
          isConnected ? 'text-green-500' : 'text-gray-500'
        )}
      >
        {isConnected ? 'Verbunden' : 'Getrennt'}
      </span>
    </div>
  )
}
