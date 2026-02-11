import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Kniff - Authentifizierung',
  description: 'Melde dich an oder erstelle einen Account',
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-green-500 mb-2">Kniff</h1>
          <p className="text-slate-400 text-sm">
            Deutsche Spieleseite für Freunde und Familie
          </p>
        </div>

        {/* Auth card container */}
        <div className="w-full max-w-md">{children}</div>

        <Toaster position="top-right" />
      </div>
    </NextIntlClientProvider>
  )
}
