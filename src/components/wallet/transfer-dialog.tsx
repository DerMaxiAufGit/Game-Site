// Reusable transfer dialog - can be triggered from any user's profile/player card.
// Usage: <TransferDialog recipientId="..." recipientName="..." trigger={<Button>Chips senden</Button>} />

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { TransferForm } from './transfer-form'

interface TransferDialogProps {
  recipientId: string
  recipientName: string
  trigger: React.ReactNode
  maxAmount?: number
  dailyLimit?: number
  currencyName?: string
}

export function TransferDialog({
  recipientId,
  recipientName,
  trigger,
  maxAmount,
  dailyLimit,
  currencyName,
}: TransferDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle>Chips an {recipientName} senden</DialogTitle>
        </DialogHeader>
        <div className="-mx-6 -mb-6">
          <TransferForm
            prefillRecipientId={recipientId}
            prefillRecipientName={recipientName}
            onSuccess={handleSuccess}
            maxAmount={maxAmount}
            dailyLimit={dailyLimit}
            currencyName={currencyName}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
