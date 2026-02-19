'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink() {
    if (!email) { toast.error('Enter your email first'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      })
      if (error) throw error
      setMagicLinkSent(true)
      toast.success('Magic link sent! Check your email.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-4xl mb-4">📬</div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-white/60">We sent a magic link to <strong>{email}</strong>. Click it to sign in.</p>
          <button onClick={() => setMagicLinkSent(false)} className="btn-secondary mt-6 w-full justify-center">
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold gradient-text">Velocast</span>
          <h1 className="text-2xl font-bold mt-4 mb-2">Welcome back</h1>
          <p className="text-white/60">Sign in to your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <button
            onClick={handleMagicLink}
            disabled={loading}
            className="mt-4 text-sm text-brand-400 hover:text-brand-300 w-full text-center block"
          >
            Sign in with magic link instead
          </button>
        </div>

        <p className="text-center text-sm text-white/60 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
