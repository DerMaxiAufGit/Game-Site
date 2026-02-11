import { getSession } from '@/lib/auth/dal'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import { SocketProvider } from '@/lib/socket/provider'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <SocketProvider>
      <div className="min-h-screen bg-zinc-950">
        {/* Desktop Sidebar */}
        <Sidebar user={session} />

        {/* Mobile Sidebar */}
        <MobileSidebar user={session} />

        {/* Main content area */}
        <main className="md:ml-64 min-h-screen">{children}</main>
      </div>
    </SocketProvider>
  )
}
