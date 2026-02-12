'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface BetConfirmationProps {
  open: boolean
  betAmount: number
  currentBalance: number
  onConfirm: () => void
  onCancel: () => void
}

export function BetConfirmation({
  open,
  betAmount,
  currentBalance,
  onConfirm,
  onCancel,
}: BetConfirmationProps) {
  const percentage = Math.round((betAmount / currentBalance) * 100)

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-amber-500">Hoher Einsatz</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-300">
            Du setzt <span className="font-bold text-amber-500">{betAmount} Chips</span> (
            <span className="font-bold">{percentage}%</span> deines Guthabens). Bist du sicher?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} className="bg-zinc-800 hover:bg-zinc-700">
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Einsatz bestaetigen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
