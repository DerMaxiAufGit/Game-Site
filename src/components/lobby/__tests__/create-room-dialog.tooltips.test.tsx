import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CreateRoomDialog } from '../create-room-dialog'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() })
}))

jest.mock('@/lib/socket/provider', () => ({
  useSocket: () => ({ socket: null })
}))

jest.mock('next-intl', () => ({
  useTranslations: () => () => ''
}))

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

test('create room dialog includes key tooltip text', () => {
  const html = renderToStaticMarkup(<CreateRoomDialog open onOpenChange={() => {}} />)
  expect(html).toContain('Der Spielmodus bestimmt die Teamaufteilung')
  expect(html).toContain('Wenn die Zeit abläuft, wird automatisch die beste Kategorie gewählt')
})
