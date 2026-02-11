'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Ban, ShieldCheck } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BanDialog } from './ban-dialog'
import { unbanUser } from '@/lib/actions/admin'
import { toast } from 'sonner'

interface User {
  id: string
  username: string
  displayName: string
  email: string
  role: 'ADMIN' | 'USER'
  createdAt: Date
  bannedAt: Date | null
  bannedReason: string | null
}

interface UserTableProps {
  users: User[]
  currentUserId: string
}

export function UserTable({ users, currentUserId }: UserTableProps) {
  const t = useTranslations('admin')
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleBanClick = (user: User) => {
    setSelectedUser(user)
    setBanDialogOpen(true)
  }

  const handleUnban = async (userId: string) => {
    const formData = new FormData()
    formData.append('userId', userId)

    const result = await unbanUser(undefined, formData)

    if (result.success) {
      toast.success(t('userUnbanned'))
    } else {
      toast.error(result.error || 'Fehler beim Entsperren')
    }
  }

  return (
    <>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
              <TableHead className="text-zinc-400">
                {t('users')} / Username
              </TableHead>
              <TableHead className="text-zinc-400">Anzeigename</TableHead>
              <TableHead className="text-zinc-400 hidden md:table-cell">
                E-Mail
              </TableHead>
              <TableHead className="text-zinc-400">{t('role')}</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400 hidden lg:table-cell">
                {t('createdAt')}
              </TableHead>
              <TableHead className="text-zinc-400 text-right">
                {t('actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId
              const isBanned = !!user.bannedAt

              return (
                <TableRow
                  key={user.id}
                  className="border-zinc-800 hover:bg-zinc-800/30"
                >
                  <TableCell className="font-medium text-white">
                    {user.username}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {user.displayName}
                  </TableCell>
                  <TableCell className="text-zinc-400 hidden md:table-cell">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {user.role === 'ADMIN' ? (
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                        ADMIN
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-zinc-700 text-zinc-400"
                      >
                        USER
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isBanned ? (
                      <Badge
                        variant="destructive"
                        className="bg-red-500/10 text-red-400 border-red-500/20"
                      >
                        {t('banned')}
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                        {t('active')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400 hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString('de-DE')}
                  </TableCell>
                  <TableCell className="text-right">
                    {!isCurrentUser && (
                      <>
                        {isBanned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnban(user.id)}
                            className="border-zinc-700 hover:bg-zinc-800"
                          >
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            {t('unbanUser')}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBanClick(user)}
                            className="border-zinc-700 hover:bg-zinc-800 text-red-400 hover:text-red-300"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            {t('banUser')}
                          </Button>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <BanDialog
          open={banDialogOpen}
          onOpenChange={setBanDialogOpen}
          userId={selectedUser.id}
          username={selectedUser.username}
        />
      )}
    </>
  )
}
