import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import LoginForm from './login-form'

// Force dynamic rendering - this page queries the database
export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  // If no users exist, redirect to setup
  const userCount = await prisma.user.count()
  if (userCount === 0) {
    redirect('/setup')
  }

  return <LoginForm />
}
