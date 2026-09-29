'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { getApiErrorMessage, MESSAGES } from '@/lib/api-error'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('demo@taskline.app')
  const [password, setPassword] = useState('demo1234')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error(MESSAGES.REQUIRED_FIELDS)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error(MESSAGES.INVALID_EMAIL)
      return
    }

    setLoading(true)
    const toastId = toast.loading('Logging you in...')
    try {
      await login(email.trim(), password)
      toast.success(MESSAGES.LOGIN_SUCCESS, { id: toastId })
      router.push('/app')
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Login failed. Please try again.'), {
        id: toastId
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <form
        className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6"
        onSubmit={handleLogin}
      >
        <div>
          <h1 className="text-lg font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Log in to your workspace.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : 'Log in'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link href="/register" className="text-foreground underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  )
}
