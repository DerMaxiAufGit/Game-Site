import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import SetupForm from './setup-form'

// Force dynamic rendering - this page queries the database
export const dynamic = 'force-dynamic'

export default async function SetupPage() {
  // Check if any user already exists
  const userCount = await prisma.user.count()

  // If admin exists, redirect to login
  if (userCount > 0) {
    redirect('/login')
  }

  return <SetupForm />
}
