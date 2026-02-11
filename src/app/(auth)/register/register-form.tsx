'use client'

import { useActionState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { registerWithInvite } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface RegisterFormProps {
  token: string
  email: string
}

export default function RegisterForm({ token, email }: RegisterFormProps) {
  const t = useTranslations('auth')
  const [state, formAction, isPending] = useActionState(
    registerWithInvite,
    null
  )

  // Show toast for general errors
  useEffect(() => {
    if (state?.message) {
      toast.error(t(state.message as any))
    }
  }, [state?.message, t])

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl text-green-500">
          {t('registerTitle')}
        </CardTitle>
        <CardDescription className="text-slate-400">
          {t('registerDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* Hidden token field */}
          <input type="hidden" name="token" value={token} />

          {/* Email (read-only, from invite) */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              readOnly
              disabled
              className="bg-slate-800 border-slate-700 text-slate-400"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">{t('username')}</Label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              disabled={isPending}
              className="bg-slate-800 border-slate-700"
            />
            {state?.errors?.username && (
              <p className="text-sm text-red-500">
                {state.errors.username[0]}
              </p>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">{t('displayName')}</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              required
              disabled={isPending}
              className="bg-slate-800 border-slate-700"
            />
            {state?.errors?.displayName && (
              <p className="text-sm text-red-500">
                {state.errors.displayName[0]}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              disabled={isPending}
              className="bg-slate-800 border-slate-700"
            />
            {state?.errors?.password && (
              <p className="text-sm text-red-500">
                {state.errors.password[0]}
              </p>
            )}
            <p className="text-xs text-slate-500">{t('passwordMin')}</p>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isPending ? `${t('register')}...` : t('register')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
