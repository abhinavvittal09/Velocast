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
