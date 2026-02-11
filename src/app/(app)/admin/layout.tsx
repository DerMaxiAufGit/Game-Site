import { requireAdmin } from '@/lib/auth/dal'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require admin access - redirects if not admin
  await requireAdmin()

  return <>{children}</>
}
