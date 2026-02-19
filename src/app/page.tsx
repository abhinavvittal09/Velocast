import Link from 'next/link'
import {
  ArrowRight, Check, Upload, Zap, BarChart3,
  Sparkles, Clock, Layers, Play,
} from 'lucide-react'
import {
  YouTubeLogo,
  TikTokLogo,
  InstagramLogo,
  LinkedInLogo,
  TwitterXLogo,
  FacebookLogo,
} from '@/components/icons/PlatformLogos'

/* ─── Data ─── */

const platforms = [
  { name: 'YouTube',   Logo: YouTubeLogo   },
  { name: 'TikTok',    Logo: TikTokLogo    },
  { name: 'Instagram', Logo: InstagramLogo },
  { name: 'LinkedIn',  Logo: LinkedInLogo  },
  { name: 'Twitter/X', Logo: TwitterXLogo  },
  { name: 'Facebook',  Logo: FacebookLogo  },
]

const features = [
  {
    icon: Upload,
    title: 'Upload once, publish everywhere',
    description: 'One file. Nine perfectly formatted variants. Velocast handles every crop, resize, and aspect ratio — automatically.',
    color: 'from-brand-900/60 to-brand-950/40',
    iconColor: 'text-brand-400',
    iconBg: 'bg-brand-950 border-brand-800/50',
  },
  {
    icon: Sparkles,
    title: 'AI captions that convert',
    description: 'Claude AI writes platform-native captions and hashtag sets tuned to each audience. Different hook for TikTok, different tone for LinkedIn.',
    color: 'from-purple-900/40 to-purple-950/20',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-950 border-purple-800/50',
  },
  {
    icon: Zap,
    title: 'Auto subtitles in seconds',
    description: 'Whisper AI transcribes your video and burns subtitles in automatically. Export SRT, VTT, or embed directly.',
    color: 'from-amber-900/30 to-amber-950/10',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-950 border-amber-800/50',
  },
  {
    icon: Clock,
    title: 'Smart scheduling',
    description: 'Queue posts across all platforms from one calendar. AI surfaces the best posting windows for your audience.',
    color: 'from-emerald-900/30 to-emerald-950/10',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-950 border-emerald-800/50',
  },
  {
    icon: BarChart3,
    title: 'Unified analytics',
    description: 'Views, reach, and engagement — every platform, one screen. No more switching between six different dashboards.',
    color: 'from-rose-900/30 to-rose-950/10',
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-950 border-rose-800/50',
  },
  {
    icon: Layers,
    title: 'Organized content library',
    description: 'Every upload, every variant, every published post — searchable and organized. Your creative archive, always at hand.',
    color: 'from-sky-900/30 to-sky-950/10',
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-950 border-sky-800/50',
  },
]

const steps = [
  { n: '01', title: 'Upload your file', body: 'Drop in a video or image — up to 500 MB. Supports MP4, MOV, WebM, JPEG, PNG, and WebP.' },
  { n: '02', title: 'AI generates everything', body: 'Your content is resized for every platform. Claude writes captions. Whisper adds subtitles.' },
  { n: '03', title: 'Review and refine', body: 'Preview every variant side by side. Edit captions, adjust hashtags, tweak timing — all from one screen.' },
  { n: '04', title: 'Schedule or publish now', body: 'One click reaches your entire audience. Schedule at the perfect time, or go live instantly.' },
]

const testimonials = [
  {
    quote: "Velocast cut my content workflow from 4 hours to under 20 minutes. I post on 6 platforms daily now without burning out.",
    name: "Sarah K.",
    handle: "@sarahcreates",
    tag: "180K followers · Lifestyle",
    initial: "S",
    color: "from-brand-700 to-purple-700",
  },
  {
    quote: "The AI captions are shockingly good. My LinkedIn engagement tripled after switching to Velocast — zero extra effort.",
    name: "Marcus T.",
    handle: "@marcusbuilds",
    tag: "45K followers · B2B",
    initial: "M",
    color: "from-emerald-700 to-teal-700",
  },
  {
    quote: "Finally one tool that understands the difference between vertical and horizontal content. Game changer for travel creators.",
    name: "Priya N.",
    handle: "@priyaexplores",
    tag: "320K followers · Travel",
    initial: "P",
    color: "from-rose-700 to-orange-700",
  },
]

const tiers = [
  {
    name: 'Free',
    price: '0',
    desc: 'For creators just getting started',
    features: ['5 uploads per month', '3 platforms', 'AI captions (10/mo)', 'Content library', 'Email support'],
    cta: 'Get started free',
    href: '/auth/signup',
    featured: false,
  },
  {
    name: 'Creator',
    price: '29',
    desc: 'For serious creators and brands',
    features: ['Unlimited uploads', 'All 9 platforms', 'Unlimited AI captions', 'Smart scheduler', 'Analytics dashboard', 'Priority support'],
    cta: 'Start 14-day free trial',
    href: '/auth/signup',
    featured: true,
  },
  {
    name: 'Pro',
    price: '69',
    desc: 'For agencies and power users',
    features: ['Everything in Creator', 'Team collaboration (5 seats)', 'Advanced analytics', 'Competitor tracking', 'Custom branding', 'Dedicated support'],
    cta: 'Contact sales',
    href: '/auth/signup',
    featured: false,
  },
]

/* ─── Dashboard Mockup ─── */
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-3xl mx-auto mt-16 animate-slide-up delay-500">
      {/* Glow under the card */}
      <div className="absolute inset-x-8 bottom-0 h-20 bg-brand-600/20 blur-3xl rounded-full" />

      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
        {/* Browser chrome */}
        <div className="bg-[#0d0d1f] border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 mx-3">
            <div className="bg-surface rounded-md px-3 py-1 flex items-center gap-2 max-w-xs mx-auto">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-white/30 font-mono">velocast.app/dashboard</span>
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="flex bg-surface" style={{ height: '240px' }}>
          {/* Sidebar */}
          <div className="w-44 border-r border-white/[0.05] p-3 flex flex-col gap-0.5 flex-shrink-0">
            <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
              <div className="w-5 h-5 bg-brand-600 rounded-md flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-bold text-white">Velocast</span>
            </div>
            {['Dashboard', 'Upload', 'Content', 'Platforms', 'Scheduler', 'Analytics'].map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] ${
                  i === 0 ? 'bg-brand-600 text-white font-medium' : 'text-white/30 hover:text-white/60'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-sm ${i === 0 ? 'bg-white/70' : 'bg-white/15'}`} />
                {item}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 overflow-hidden">
            <div className="text-xs text-white/40 mb-3 font-medium">Welcome back, Sarah 👋</div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: 'Uploads', val: '24', color: 'text-brand-400' },
                { label: 'Published', val: '9', color: 'text-emerald-400' },
                { label: 'AI Credits', val: '142', color: 'text-amber-400' },
                { label: 'Platforms', val: '6', color: 'text-purple-400' },
              ].map((s) => (
                <div key={s.label} className="bg-surface-card rounded-lg p-2 border border-white/[0.04]">
                  <div className="text-[9px] text-white/30 mb-1">{s.label}</div>
                  <div className={`text-base font-bold ${s.color}`}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Reels — 1080×1920', color: 'bg-pink-900/30', icon: '🎬' },
                { label: 'Feed — 1080×1080', color: 'bg-brand-900/30', icon: '📸' },
                { label: 'YouTube — 1920×1080', color: 'bg-red-900/30', icon: '▶️' },
              ].map((c) => (
                <div key={c.label} className={`${c.color} rounded-lg p-2 border border-white/[0.04] aspect-video flex flex-col justify-between`}>
                  <span className="text-base">{c.icon}</span>
                  <span className="text-[9px] text-white/40">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-white overflow-x-hidden">

      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.05] bg-surface/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight">Velocast</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#pricing', 'Pricing']].map(([href, label]) => (
                <a key={href} href={href} className="text-xs text-white/40 hover:text-white transition-colors duration-200">
                  {label}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-xs text-white/40 hover:text-white transition-colors">Sign in</Link>
              <Link href="/auth/signup" className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors duration-200">
                Get started <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-36 pb-8 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 dot-grid opacity-100 pointer-events-none" />
        <div className="absolute inset-0 hero-glow pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-700/40 bg-brand-950/60 mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-[11px] font-medium text-brand-300">Now in beta &nbsp;·&nbsp; Free forever</span>
          </div>

          {/* Headline */}
          <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] font-bold tracking-tight leading-[1.06] mb-6 animate-fade-in delay-100">
            Create once.{' '}
            <span className="shimmer">Publish everywhere.</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto leading-relaxed mb-10 animate-fade-in delay-200">
            Velocast turns one upload into perfectly formatted content for every
            platform — with AI captions, auto subtitles, and a smart scheduler built in.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 animate-fade-in delay-300">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-brand-900/50"
            >
              Start for free — no card needed
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white border border-white/[0.08] hover:border-white/20 px-6 py-3 rounded-xl transition-all duration-200"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> See how it works
            </a>
          </div>

          {/* Platform logos strip */}
          <div className="animate-fade-in delay-400">
            <p className="text-[11px] text-white/25 mb-4 tracking-wide">Publish natively to</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {platforms.map(({ name, Logo }) => (
                <div
                  key={name}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-200 cursor-default group"
                >
                  <Logo className="w-4 h-4 flex-shrink-0" />
                  <span className="text-[11px] text-white/50 group-hover:text-white/80 transition-colors">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <DashboardMockup />
      </section>

      {/* ─── Stats + Logo strip ─── */}
      <div className="border-y border-white/[0.05] py-10 px-6 mt-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: '9',    label: 'Platforms supported' },
              { value: '<2m',  label: 'Average time to publish' },
              { value: '100%', label: 'Free to get started' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">{s.value}</div>
                <div className="text-xs text-white/35 tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Logo row */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {platforms.map(({ name, Logo }) => (
              <div key={name} className="flex items-center gap-1.5 opacity-50 hover:opacity-90 transition-opacity duration-200" title={name}>
                <Logo className="w-5 h-5" />
                <span className="text-[11px] text-white/60 hidden sm:block">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Features ─── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest text-brand-400 uppercase mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Your entire content workflow,<br className="hidden sm:block" /> in one place
            </h2>
            <p className="text-white/45 max-w-lg mx-auto text-sm leading-relaxed">
              Stop juggling five different tools. Velocast handles everything from raw upload to published post — elegantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="card-glow p-6 group">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${f.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  <f.icon className={`w-[18px] h-[18px] ${f.iconColor}`} />
                </div>
                <h3 className="font-semibold text-sm mb-2 text-white/90">{f.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="py-28 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest text-brand-400 uppercase mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              From upload to live<br className="hidden sm:block" /> in under two minutes
            </h2>
            <p className="text-white/45 max-w-md mx-auto text-sm leading-relaxed">
              A creator-first workflow designed to get your content live faster — without sacrificing an ounce of quality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className="card-glow p-7 flex gap-5"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-950 border border-brand-800/40 flex items-center justify-center">
                    <span className="text-xs font-mono font-bold text-brand-400">{step.n}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-2">{step.title}</h3>
                  <p className="text-xs text-white/45 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-28 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest text-brand-400 uppercase mb-3">Social proof</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Creators who switched<br className="hidden sm:block" /> never looked back
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div key={t.name} className="card-glow p-6 flex flex-col justify-between gap-5">
                <p className="text-sm text-white/70 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {t.initial}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-white/35">{t.tag}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-28 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest text-brand-400 uppercase mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Simple, creator-first pricing
            </h2>
            <p className="text-white/45 max-w-sm mx-auto text-sm">
              Start free. Upgrade when you need more. Cancel any time — no questions asked.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative p-7 rounded-2xl border transition-all duration-300 ${
                  tier.featured
                    ? 'border-brand-600/50 bg-gradient-to-b from-brand-950/50 to-surface-card shadow-[0_0_40px_rgba(79,82,229,0.12)]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                    <span className="px-3 py-1 rounded-full bg-brand-600 text-white text-[10px] font-semibold tracking-wide uppercase">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="text-xs text-white/40 mb-2 font-medium">{tier.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  {tier.price !== '0' && <span className="text-white/30 text-base">$</span>}
                  <span className="text-4xl font-bold">{tier.price === '0' ? 'Free' : tier.price}</span>
                  {tier.price !== '0' && <span className="text-white/35 text-xs">/month</span>}
                </div>
                <div className="text-[11px] text-white/35 mb-6">{tier.desc}</div>

                <ul className="space-y-2.5 mb-7">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs text-white/65">
                      <Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.href}
                  className={`block text-center text-xs font-semibold py-2.5 rounded-xl transition-all duration-200 ${
                    tier.featured
                      ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-900/40'
                      : 'border border-white/[0.10] hover:border-white/25 hover:bg-white/[0.04] text-white/65 hover:text-white'
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
      <section className="py-28 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-brand-700/30 bg-gradient-to-br from-brand-950/80 via-surface-card to-surface-card p-12 text-center">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-brand-600/15 blur-3xl rounded-full pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-brand-700/40 bg-brand-950/60">
                <Sparkles className="w-3 h-3 text-brand-400" />
                <span className="text-[11px] text-brand-300 font-medium">Join 2,000+ creators already using Velocast</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Ready to reclaim your time?
              </h2>
              <p className="text-white/45 text-sm mb-8 max-w-md mx-auto leading-relaxed">
                Your first 5 uploads are free. No credit card required.
                Start publishing smarter in the next 5 minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/auth/signup"
                  className="group inline-flex items-center gap-2 bg-white text-surface font-semibold text-sm px-7 py-3 rounded-xl hover:bg-white/90 transition-colors duration-200"
                >
                  Create your free account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/auth/login" className="text-sm text-white/40 hover:text-white transition-colors">
                  Already have an account? Sign in →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.05] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold">Velocast</span>
            <span className="text-xs text-white/20 ml-2">Built for creators.</span>
          </div>
          <div className="flex items-center gap-6">
            {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#pricing', 'Pricing'], ['/auth/signup', 'Sign up']].map(([href, label]) => (
              <a key={label} href={href} className="text-xs text-white/25 hover:text-white/60 transition-colors">
                {label}
              </a>
            ))}
          </div>
          <p className="text-xs text-white/15">© {new Date().getFullYear()} Velocast</p>
        </div>
      </footer>

    </div>
  )
}
