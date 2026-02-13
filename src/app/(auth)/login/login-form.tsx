'use client'

import { useActionState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { login } from '@/lib/actions/auth'
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

export default function LoginForm() {
  const t = useTranslations('auth')
  const [state, formAction, isPending] = useActionState(login, null)

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
          {t('loginTitle')}
        </CardTitle>
        <CardDescription className="text-slate-400">
          {t('loginDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              className="bg-slate-800 border-slate-700"
            />
            {state?.errors?.email && (
              <p className="text-sm text-red-500">{state.errors.email[0]}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isPending}
              className="bg-slate-800 border-slate-700"
            />
            {state?.errors?.password && (
              <p className="text-sm text-red-500">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isPending ? `${t('login')}...` : t('login')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
