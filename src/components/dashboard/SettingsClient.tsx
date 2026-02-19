'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, CreditCard, Zap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  plan: string | null
  ai_credits_used: number | null
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

export default function SettingsClient({
  user,
  profile,
  initialTab,
}: {
  user: { id: string; email: string }
  profile: Profile | null
  initialTab: string
}) {
  const [activeTab, setActiveTab] = useState(
    TABS.find((t) => t.id === initialTab)?.id ?? 'profile'
  )
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          full_name: [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null,
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Profile saved')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-white/60 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-surface-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-brand-500 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="max-w-lg space-y-6">
          <form onSubmit={handleSaveProfile} className="card space-y-4">
            <h2 className="font-semibold">Personal information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  className="input"
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
                />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="input opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-white/40 mt-1">
                Email changes are managed through your auth provider.
              </p>
            </div>

            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save changes
            </button>
          </form>

          <div className="card space-y-3">
            <h2 className="font-semibold">Account</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Current plan</span>
              <span className="badge badge-brand capitalize">{profile?.plan ?? 'free'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">AI credits used</span>
              <span>{profile?.ai_credits_used ?? 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Billing tab */}
      {activeTab === 'billing' && (
        <div className="max-w-lg space-y-6">
          {/* Current plan */}
          <div className="card space-y-4">
            <h2 className="font-semibold">Current plan</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium capitalize">{profile?.plan ?? 'Free'} plan</div>
                <div className="text-sm text-white/50 mt-0.5">
                  {profile?.plan === 'free'
                    ? '5 uploads · 6 platforms · basic transforms'
                    : 'Unlimited uploads · all platforms · AI captions'}
                </div>
              </div>
              <span className="badge badge-brand capitalize">{profile?.plan ?? 'free'}</span>
            </div>
          </div>

          {/* Upgrade CTA */}
          {(!profile?.plan || profile?.plan === 'free') && (
            <div className="card border-brand-600/40 bg-gradient-to-br from-brand-950/60 to-surface-card text-center py-12">
              <div className="w-12 h-12 bg-brand-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">Upgrade to Creator</h3>
              <p className="text-white/60 text-sm mb-6 max-w-xs mx-auto">
                Unlimited uploads, AI-generated captions, all 9 platforms, and the
                post scheduler.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-950 border border-brand-800 text-brand-300 text-sm">
                <Zap className="w-3.5 h-3.5" /> Stripe billing — coming in Week 6
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
