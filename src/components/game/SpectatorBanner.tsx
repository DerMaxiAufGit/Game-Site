'use client'

import { useState } from 'react'
import { Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface SpectatorBannerProps {
  isSpectator: boolean
}

export function SpectatorBanner({ isSpectator }: SpectatorBannerProps) {
  const t = useTranslations('game')
  const [isDismissed, setIsDismissed] = useState(false)

  if (!isSpectator || isDismissed) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 flex-shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-semibold">{t('spectating')}</span>
            <span className="text-sm">
              Du kannst in der nächsten Runde mitspielen
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDismissed(true)}
          className="text-amber-950 hover:bg-amber-600 hover:text-amber-950 flex-shrink-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Schließen</span>
        </Button>
      </div>
    </div>
  )
}
