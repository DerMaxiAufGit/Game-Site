import { requireAdmin } from '@/lib/auth/dal'

export default async function AdminFinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require admin access - redirects if not admin
  await requireAdmin()

  return <>{children}</>
}
