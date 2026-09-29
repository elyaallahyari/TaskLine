'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { getApiErrorMessage, MESSAGES } from '@/lib/api-error'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error(MESSAGES.WEAK_PASSWORD)
      return
    }

    setLoading(true)
    const toastId = toast.loading('Creating your account...')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw { response: { status: res.status, data } }
      }

      const data = await res.json()
      localStorage.setItem('token', data.access_token)

      toast.success(MESSAGES.REGISTER_SUCCESS, { id: toastId })
      router.push('/app')
    } catch (err) {
      const message = getApiErrorMessage(err, 'Registration failed. Please try again.')
      toast.error(message, { id: toastId })
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
        onSubmit={handleRegister}
      >
        <div>
          <h1 className="text-lg font-semibold">Create TaskLine</h1>
          <p className="text-sm text-muted-foreground">Your boards start empty and quiet.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
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
          {loading ? 'Please wait...' : 'Create account'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already here?{' '}
          <Link href="/login" className="text-foreground underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
