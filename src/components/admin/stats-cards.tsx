import { Users, Activity, Mail } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

interface StatsCardsProps {
  stats: {
    totalUsers: number
    activeNow: number
    pendingInvites: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations('admin')

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-500/10">
            <Users className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-zinc-400">{t('totalUsers')}</p>
            <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
          </div>
        </div>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-500/10">
            <Activity className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-zinc-400">{t('activeNow')}</p>
            <p className="text-2xl font-bold text-white">{stats.activeNow}</p>
          </div>
        </div>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-500/10">
            <Mail className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-zinc-400">{t('pendingInvites')}</p>
            <p className="text-2xl font-bold text-white">
              {stats.pendingInvites}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
