import { getAdminStats, getUsers } from '@/lib/actions/admin'
import { requireAdmin } from '@/lib/auth/dal'
import { StatsCards } from '@/components/admin/stats-cards'
import { UserTable } from '@/components/admin/user-table'
import { InviteDialog } from '@/components/admin/invite-dialog'
import { ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await requireAdmin()

  // Fetch stats and users in parallel
  const [stats, users] = await Promise.all([getAdminStats(), getUsers()])

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">
                Admin-Dashboard
              </h1>
              <p className="text-zinc-400 mt-1">
                Verwaltung von Nutzern und Einladungen
              </p>
            </div>
          </div>
          <InviteDialog />
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* User Table */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Alle Nutzer</h2>
          <UserTable users={users} currentUserId={session.userId} />
        </div>
      </div>
    </div>
  )
}
