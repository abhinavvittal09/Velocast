'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState(false)
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
          },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      setVerifyEmail(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  if (verifyEmail) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-white/60">
            We sent a verification link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
          <Link href="/auth/login" className="btn-secondary mt-6 w-full justify-center inline-flex">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold gradient-text">Velocast</span>
          <h1 className="text-2xl font-bold mt-4 mb-2">Create your account</h1>
          <p className="text-white/60">Free forever · No credit card required</p>
        </div>

        <div className="card">
          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } })}
            className="btn-secondary w-full justify-center mb-6"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-white/40">or email</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* First name + Last name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="input"
                  required
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="label">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="input"
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Phone */}
            <div>
              <label className="label">
                Phone number <span className="text-white/30 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="input"
                autoComplete="tel"
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="input pr-10"
                  required
                  minLength={8}
                  autoComplete="new-password"
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
              {password.length > 0 && password.length < 8 && (
                <p className="text-xs text-red-400 mt-1">{8 - password.length} more characters needed</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
            </button>
          </form>

          <p className="text-xs text-white/30 text-center mt-4">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-center text-sm text-white/60 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-400 hover:text-brand-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
