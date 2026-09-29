'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, TOKEN_KEY } from './api'
import type { AuthResponse, User } from './types'

type AuthContextValue = {
  user: User | null
  ready: boolean
  loading: boolean // alias for compatibility
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function isUser(v: unknown): v is User {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return typeof o.id === 'string' && typeof o.email === 'string' && typeof o.name === 'string'
}

function extractToken(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null
  const o = data as Record<string, unknown>
  if (typeof o.accessToken === 'string') return o.accessToken
  if (typeof o.access_token === 'string') return o.access_token
  if (typeof o.token === 'string') return o.token
  return null
}

function extractUser(data: unknown): User | null {
  if (typeof data !== 'object' || data === null) return null
  const o = data as Record<string, unknown>
  if (isUser(o.user)) return o.user
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true)
      return
    }
    api<User>('/auth/me')
      .then((me) => setUser(me))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      })
      .finally(() => setReady(true))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      loading: !ready,
      async login(email, password) {
        const res = await api<AuthResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        })
        const token = extractToken(res)
        if (!token) throw new Error('Login failed. Please try again.')
        localStorage.setItem(TOKEN_KEY, token)
        const u = extractUser(res) ?? res.user
        setUser(u)
      },
      async register(name, email, password) {
        const res = await api<AuthResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password })
        })
        const token = extractToken(res)
        if (!token) throw new Error('Registration failed. Please try again.')
        localStorage.setItem(TOKEN_KEY, token)
        const u = extractUser(res) ?? res.user
        setUser(u)
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      }
    }),
    [user, ready]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
