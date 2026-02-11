'use client'

import { useActionState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Ban } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { banUser } from '@/lib/actions/admin'
import { toast } from 'sonner'

interface BanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  username: string
}

export function BanDialog({
  open,
  onOpenChange,
  userId,
  username,
}: BanDialogProps) {
  const t = useTranslations('admin')
  const [state, action, pending] = useActionState(banUser, undefined)

  useEffect(() => {
    if (state?.success) {
      toast.success(t('userBanned'))
      onOpenChange(false)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, onOpenChange, t])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <Ban className="h-5 w-5" />
            {t('banUser')}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Möchtest du <span className="font-bold">{username}</span> wirklich
            sperren?
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4 py-4">
          <input type="hidden" name="userId" value={userId} />

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-zinc-300">
              {t('banReason')}
            </Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder="Verstoß gegen Community-Regeln..."
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={pending}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              {pending ? 'Sperrt...' : t('banUser')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
