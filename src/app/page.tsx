import Link from 'next/link'
import { ArrowRight, Upload, Zap, Globe, BarChart3, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Upload,
    title: 'Upload Once',
    description: 'Upload your video or image once. Velocast auto-resizes for every platform — Reels, TikTok, Shorts, LinkedIn, Twitter.',
  },
  {
    icon: Sparkles,
    title: 'AI Captions',
    description: 'Generate platform-specific captions, hashtags, and hooks using Claude AI — tailored to your tone and audience.',
  },
  {
    icon: Zap,
    title: 'Auto Subtitles',
    description: 'Whisper AI transcribes and burns in subtitles automatically. Export SRT/VTT or burn in for social-native video.',
  },
  {
    icon: Globe,
    title: 'Publish Everywhere',
    description: 'Schedule and publish to YouTube, Instagram, TikTok, LinkedIn, and Twitter from one dashboard.',
  },
  {
    icon: BarChart3,
    title: 'Unified Analytics',
    description: 'See all your performance data in one place. Understand what works across platforms without switching apps.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-surface-border bg-surface/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <span className="text-xl font-bold gradient-text">Velocast</span>
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/auth/signup" className="btn-primary text-sm py-1.5 px-4">
                Get started free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="badge-brand mb-6 mx-auto w-fit">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered Content Management
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Upload Once.{' '}
            <span className="gradient-text">Publish Everywhere.</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
            Velocast auto-resizes your content for every platform, generates AI captions,
            adds subtitles, and schedules posts — all in one creator-first workflow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup" className="btn-primary text-base px-6 py-3">
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#features" className="btn-secondary text-base px-6 py-3">
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/40">No credit card required · Free plan forever</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything creators need
          </h2>
          <p className="text-white/60 text-center mb-12 max-w-xl mx-auto">
            Stop juggling 5 different tools. Velocast handles your entire content workflow.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="card hover:border-brand-600/50 transition-colors">
                <feature.icon className="w-8 h-8 text-brand-400 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 px-4 border-t border-surface-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Simple, creator-first pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
            {[
              { name: 'Free', price: '$0', desc: 'Perfect to get started', features: ['5 uploads/mo', '3 platforms', 'AI captions (10/mo)'] },
              { name: 'Creator', price: '$29', desc: '/month · most popular', features: ['Unlimited uploads', 'All platforms', 'Unlimited AI captions', 'Scheduler'] },
              { name: 'Pro', price: '$69', desc: '/month', features: ['Everything in Creator', 'Analytics dashboard', 'Competitor tracking', 'Priority support'] },
            ].map((tier) => (
              <div key={tier.name} className={`card text-left ${tier.name === 'Creator' ? 'border-brand-600' : ''}`}>
                <div className="text-sm text-white/60 mb-1">{tier.name}</div>
                <div className="text-3xl font-bold mb-0.5">{tier.price}</div>
                <div className="text-xs text-white/40 mb-4">{tier.desc}</div>
                <ul className="space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="text-sm text-white/70 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Link href="/auth/signup" className="btn-primary mt-10 mx-auto text-base px-8 py-3 inline-flex">
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-surface-border text-center text-sm text-white/40">
        © {new Date().getFullYear()} Velocast. Built for creators.
      </footer>
    </div>
  )
}
