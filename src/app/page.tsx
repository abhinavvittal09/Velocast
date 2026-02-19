import Link from 'next/link'
import { ArrowRight, Check, Upload, Zap, Globe, BarChart3, Sparkles, Clock, Layers } from 'lucide-react'

// Platform icons as inline SVG paths (color-coded)
const platforms = [
  { name: 'YouTube',   color: '#FF0000', abbr: 'YT' },
  { name: 'TikTok',    color: '#ffffff', abbr: 'TT' },
  { name: 'Instagram', color: '#E1306C', abbr: 'IG' },
  { name: 'LinkedIn',  color: '#0A66C2', abbr: 'LI' },
  { name: 'Twitter/X', color: '#ffffff', abbr: '𝕏'  },
  { name: 'Facebook',  color: '#1877F2', abbr: 'FB' },
]

const features = [
  {
    icon: Upload,
    title: 'Upload once, reach everywhere',
    description: 'One file. Nine formats. Velocast auto-resizes your content to perfect dimensions for every platform — no manual cropping, ever.',
  },
  {
    icon: Sparkles,
    title: 'AI captions that convert',
    description: 'Claude AI writes platform-native captions and hashtag sets tuned to each audience. Different hook for TikTok, different tone for LinkedIn.',
  },
  {
    icon: Zap,
    title: 'Subtitles in 60 seconds',
    description: 'Whisper AI transcribes your video and burns in subtitles automatically. Export SRT, VTT, or embed directly — your choice.',
  },
  {
    icon: Clock,
    title: 'Schedule at peak times',
    description: 'Queue posts across all platforms from a single calendar. AI recommends optimal posting windows based on your audience data.',
  },
  {
    icon: BarChart3,
    title: 'Unified analytics dashboard',
    description: 'Views, likes, reach, and engagement — every platform, one screen. Stop switching between six different apps to understand your numbers.',
  },
  {
    icon: Layers,
    title: 'Content library built in',
    description: 'Every upload, every variant, every published post — organized and searchable. Your creative archive, always at hand.',
  },
]

const steps = [
  { n: '01', title: 'Upload', body: 'Drop in your video or image. Velocast accepts up to 500 MB and works with MP4, MOV, WebM, JPEG, PNG, and WebP.' },
  { n: '02', title: 'Generate', body: 'In seconds, your content is resized for every platform. AI writes tailored captions and subtitles are transcribed automatically.' },
  { n: '03', title: 'Review', body: 'Preview every variant side by side. Edit captions, tweak hashtags, adjust timing — everything from one screen.' },
  { n: '04', title: 'Publish', body: 'Schedule to go live at the perfect time, or publish right now. One click reaches your entire audience across every platform.' },
]

const tiers = [
  {
    name: 'Free',
    price: '0',
    desc: 'For creators just getting started',
    features: ['5 uploads per month', '3 platforms', 'AI captions (10/mo)', 'Content library', 'Email support'],
    cta: 'Get started free',
    featured: false,
  },
  {
    name: 'Creator',
    price: '29',
    desc: 'For serious creators and brands',
    features: ['Unlimited uploads', 'All 9 platforms', 'Unlimited AI captions', 'Smart scheduler', 'Analytics dashboard', 'Priority support'],
    cta: 'Start free trial',
    featured: true,
  },
  {
    name: 'Pro',
    price: '69',
    desc: 'For agencies and power users',
    features: ['Everything in Creator', 'Team collaboration', 'Advanced analytics', 'Competitor tracking', 'Dedicated support', 'Custom branding'],
    cta: 'Contact sales',
    featured: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-white">

      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-surface/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight">Velocast</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-white/50 hover:text-white transition-colors">Features</Link>
              <Link href="#how-it-works" className="text-sm text-white/50 hover:text-white transition-colors">How it works</Link>
              <Link href="#pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-sm text-white/50 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/auth/signup" className="btn-primary text-sm py-1.5 px-4">
                Get started
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-800/60 bg-brand-950/40 text-brand-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Now in beta · Free forever
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
            Create once.{' '}
            <br className="hidden sm:block" />
            <span className="gradient-text">Publish everywhere.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
            Velocast turns one upload into perfectly formatted content for every platform — with
            AI captions, auto subtitles, and a smart scheduler built in.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link href="/auth/signup" className="btn-primary text-sm px-6 py-2.5 rounded-xl">
              Start for free — no card needed
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#how-it-works" className="btn-secondary text-sm px-6 py-2.5 rounded-xl">
              See how it works
            </Link>
          </div>

          {/* Platform badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-white/30 mr-1">Works with</span>
            {platforms.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-card border border-surface-border text-xs text-white/60"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats bar ─── */}
      <div className="border-y border-white/[0.06] py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: '9', label: 'Platforms supported' },
            { value: '60s', label: 'Average time to publish' },
            { value: '100%', label: 'Free to start' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">{s.value}</div>
              <div className="text-sm text-white/40">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Features ─── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Your entire content workflow,<br className="hidden sm:block" /> in one place
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Stop stitching together five different tools. Velocast handles everything from raw upload to published post.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-brand-700/40 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-950 border border-brand-800/50 flex items-center justify-center mb-4">
                  <f.icon className="w-4.5 h-4.5 text-brand-400" style={{ width: '1.125rem', height: '1.125rem' }} />
                </div>
                <h3 className="font-semibold text-base mb-2 text-white">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              From upload to published<br className="hidden sm:block" /> in under two minutes
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              A creator-first workflow designed to get your content live faster — without sacrificing quality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {steps.map((step) => (
              <div
                key={step.n}
                className="p-7 rounded-2xl border border-white/[0.07] bg-white/[0.02]"
              >
                <div className="text-xs font-mono text-brand-500 mb-3 tracking-widest">{step.n}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Simple, creator-first pricing
            </h2>
            <p className="text-white/50 max-w-md mx-auto">
              Start free. Upgrade when you need more. Cancel any time — no questions asked.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative p-7 rounded-2xl border transition-all ${
                  tier.featured
                    ? 'border-brand-600/60 bg-brand-950/20'
                    : 'border-white/[0.07] bg-white/[0.02]'
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-semibold">
                    Most popular
                  </div>
                )}
                <div className="text-sm text-white/50 mb-2">{tier.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-white/30 text-xl">$</span>
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.price !== '0' && <span className="text-white/40 text-sm">/mo</span>}
                </div>
                <div className="text-xs text-white/40 mb-6">{tier.desc}</div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                      <Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup"
                  className={`block text-center text-sm font-medium py-2.5 rounded-xl transition-colors ${
                    tier.featured
                      ? 'bg-brand-600 hover:bg-brand-500 text-white'
                      : 'border border-white/[0.12] hover:border-white/25 text-white/70 hover:text-white'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to reclaim your time?
          </h2>
          <p className="text-white/50 mb-10">
            Join thousands of creators who publish smarter — not harder.
            Start free, no credit card required.
          </p>
          <Link href="/auth/signup" className="btn-primary text-sm px-8 py-3 rounded-xl mx-auto">
            Create your free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold">Velocast</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-xs text-white/30 hover:text-white/60 transition-colors">Features</Link>
            <Link href="#pricing" className="text-xs text-white/30 hover:text-white/60 transition-colors">Pricing</Link>
            <Link href="/auth/signup" className="text-xs text-white/30 hover:text-white/60 transition-colors">Sign up</Link>
          </div>
          <p className="text-xs text-white/20">© {new Date().getFullYear()} Velocast. Built for creators.</p>
        </div>
      </footer>

    </div>
  )
}
