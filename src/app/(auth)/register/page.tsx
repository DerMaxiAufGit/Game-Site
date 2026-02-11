import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import RegisterForm from './register-form'

// Force dynamic rendering - this page queries the database
export const dynamic = 'force-dynamic'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const token = params.token

  // If no token, show error
  if (!token) {
    return (
      <div className="text-center p-8 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg">
        <h2 className="text-xl font-semibold text-red-500 mb-2">
          Einladung nicht gefunden
        </h2>
        <p className="text-slate-400">
          Diese Seite benötigt einen gültigen Einladungslink.
        </p>
      </div>
    )
  }

  // Validate token server-side
  const invite = await prisma.invite.findUnique({
    where: { token },
  })

  if (!invite) {
    return (
      <div className="text-center p-8 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg">
        <h2 className="text-xl font-semibold text-red-500 mb-2">
          Einladung nicht gefunden
        </h2>
        <p className="text-slate-400">
          Diese Einladung existiert nicht oder ist ungültig.
        </p>
      </div>
    )
  }

  if (invite.usedAt) {
    return (
      <div className="text-center p-8 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg">
        <h2 className="text-xl font-semibold text-red-500 mb-2">
          Einladung bereits verwendet
        </h2>
        <p className="text-slate-400">
          Diese Einladung wurde bereits verwendet.
        </p>
      </div>
    )
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div className="text-center p-8 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg">
        <h2 className="text-xl font-semibold text-red-500 mb-2">
          Einladung abgelaufen
        </h2>
        <p className="text-slate-400">
          Diese Einladung ist leider abgelaufen.
        </p>
      </div>
    )
  }

  // Valid invite - show registration form
  return <RegisterForm token={token} email={invite.email} />
}
