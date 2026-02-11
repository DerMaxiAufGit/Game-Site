export type UserRole = 'ADMIN' | 'USER'

export interface SessionPayload {
  userId: string
  role: UserRole
  expiresAt: Date
}

export interface ActionState<T = any> {
  errors?: {
    [K in keyof T]?: string[]
  }
  message?: string
  success?: boolean
}
