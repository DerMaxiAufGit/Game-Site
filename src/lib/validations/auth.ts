import { z } from 'zod'

// Setup schema - for first admin user creation
export const setupSchema = z.object({
  username: z
    .string()
    .min(3, 'Mindestens 3 Zeichen')
    .max(30, 'Maximal 30 Zeichen')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Nur Buchstaben, Zahlen und Unterstrich erlaubt'
    ),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Mindestens 8 Zeichen'),
  displayName: z
    .string()
    .min(2, 'Mindestens 2 Zeichen')
    .max(50, 'Maximal 50 Zeichen'),
})

// Login schema - intentionally minimal password validation to avoid leaking requirements
export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort erforderlich'),
})

// Register schema - for invited users
export const registerSchema = z.object({
  token: z.string().min(1, 'Token erforderlich'),
  username: z
    .string()
    .min(3, 'Mindestens 3 Zeichen')
    .max(30, 'Maximal 30 Zeichen')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Nur Buchstaben, Zahlen und Unterstrich erlaubt'
    ),
  password: z.string().min(8, 'Mindestens 8 Zeichen'),
  displayName: z
    .string()
    .min(2, 'Mindestens 2 Zeichen')
    .max(50, 'Maximal 50 Zeichen'),
})

// Export inferred types
export type SetupFormData = z.infer<typeof setupSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
