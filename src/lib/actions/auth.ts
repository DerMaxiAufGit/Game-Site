'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/db'
import { createSession, deleteSession } from '@/lib/auth/session'
import {
  setupSchema,
  loginSchema,
  registerSchema,
  type SetupFormData,
  type LoginFormData,
  type RegisterFormData,
} from '@/lib/validations/auth'
import type { ActionState } from '@/types'

const SALT_ROUNDS = 10

// Setup admin - creates first user as admin
export async function setupAdmin(
  prevState: ActionState<SetupFormData> | null,
  formData: FormData
): Promise<ActionState<SetupFormData>> {
  // Parse and validate form data
  const result = setupSchema.safeParse({
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
  })

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors as any,
    }
  }

  try {
    // Check if any user already exists
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      return {
        message: 'setupAlreadyDone',
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(result.data.password, SALT_ROUNDS)

    // Create admin user with race condition protection
    try {
      const user = await prisma.user.create({
        data: {
          username: result.data.username,
          email: result.data.email,
          passwordHash,
          displayName: result.data.displayName,
          role: 'ADMIN',
        },
      })

      // Create session
      await createSession(user.id, 'ADMIN')
    } catch (error: any) {
      // Handle unique constraint violations (race condition)
      if (error.code === 'P2002') {
        return {
          message: 'setupAlreadyDone',
        }
      }
      throw error
    }
  } catch (error) {
    console.error('Setup admin error:', error)
    return {
      message: 'error',
    }
  }

  redirect('/')
}

// Login - authenticate existing user
export async function login(
  prevState: ActionState<LoginFormData> | null,
  formData: FormData
): Promise<ActionState<LoginFormData>> {
  // Parse and validate form data
  const result = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors as any,
    }
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: result.data.email },
    })

    // If no user or password doesn't match, return generic error
    if (!user) {
      return {
        message: 'invalidCredentials',
      }
    }

    const passwordMatch = await bcrypt.compare(
      result.data.password,
      user.passwordHash
    )

    if (!passwordMatch) {
      return {
        message: 'invalidCredentials',
      }
    }

    // Check if user is banned
    if (user.bannedAt) {
      return {
        message: 'accountBanned',
      }
    }

    // Create session
    await createSession(user.id, user.role)
  } catch (error) {
    console.error('Login error:', error)
    return {
      message: 'error',
    }
  }

  redirect('/')
}

// Register with invite - create user from invite token
export async function registerWithInvite(
  prevState: ActionState<RegisterFormData> | null,
  formData: FormData
): Promise<ActionState<RegisterFormData>> {
  // Parse and validate form data
  const result = registerSchema.safeParse({
    token: formData.get('token'),
    username: formData.get('username'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
  })

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors as any,
    }
  }

  try {
    // Find valid invite
    const invite = await prisma.invite.findUnique({
      where: { token: result.data.token },
    })

    if (!invite) {
      return {
        message: 'inviteNotFound',
      }
    }

    if (invite.usedAt) {
      return {
        message: 'inviteUsed',
      }
    }

    if (invite.expiresAt < new Date()) {
      return {
        message: 'inviteExpired',
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(result.data.password, SALT_ROUNDS)

    // Use transaction to atomically create user and mark invite as used
    try {
      const user = await prisma.$transaction(async (tx) => {
        // Mark invite as used
        await tx.invite.update({
          where: { id: invite.id },
          data: { usedAt: new Date() },
        })

        // Create user
        return await tx.user.create({
          data: {
            username: result.data.username,
            email: invite.email,
            passwordHash,
            displayName: result.data.displayName,
            role: 'USER',
          },
        })
      })

      // Create session
      await createSession(user.id, 'USER')
    } catch (error: any) {
      // Handle unique constraint violations (username or email)
      if (error.code === 'P2002') {
        const target = error.meta?.target?.[0]
        if (target === 'username') {
          return {
            errors: {
              username: ['Benutzername bereits vergeben'],
            },
          }
        }
        if (target === 'email') {
          return {
            message: 'inviteUsed',
          }
        }
      }
      throw error
    }
  } catch (error) {
    console.error('Register with invite error:', error)
    return {
      message: 'error',
    }
  }

  redirect('/')
}

// Logout - clear session
export async function logout() {
  await deleteSession()
  redirect('/login')
}
