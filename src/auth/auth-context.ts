import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { UserDoc } from '../lib/users'

export interface AuthContextValue {
  /** Firebase auth user, or null when signed out. */
  user: User | null
  /** Live `users/{uid}` doc (invite code, theme, …), or null until loaded. */
  userDoc: UserDoc | null
  /** True until the first auth state + user doc resolve. */
  loading: boolean
  /** Non-null if sign-in or doc setup failed. */
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
