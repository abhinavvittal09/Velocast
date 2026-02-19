# Velocast — Developer Setup Guide

## Prerequisites

1. **Node.js 20+** — install via [nvm](https://github.com/nvm-sh/nvm):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   # restart terminal, then:
   nvm install --lts && nvm use --lts
   ```

2. **Supabase CLI** (optional, for local dev):
   ```bash
   npm install -g supabase
   ```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase, Anthropic, Stripe, etc. keys

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com) (free)
2. Go to **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`
3. Enable **Google OAuth** in Authentication > Providers
4. Set the redirect URL: `https://your-project.supabase.co/auth/v1/callback`
5. Copy your keys to `.env.local`

## Tech Stack

| Layer | Tech | Cost |
|-------|------|------|
| Frontend | Next.js 14 + TypeScript + Tailwind | Free |
| Database + Auth + Storage | Supabase | Free (500MB) |
| AI Captions | Anthropic Claude Haiku | ~$0.25/1M tokens |
| AI Subtitles | Groq Whisper | Free tier |
| Payments | Stripe | Free until revenue |
| Email | Resend | 3k/mo free |
| Hosting | Vercel | Free hobby plan |
| Image Processing | Sharp (Node.js) | Free |
| Video Processing | FFmpeg | Free (open source) |

## Project Structure

```
src/
├── app/                   # Next.js App Router
│   ├── auth/              # Login, signup, callback
│   ├── dashboard/         # Protected dashboard pages
│   │   ├── upload/        # Day 5: File upload
│   │   ├── content/       # Day 11: Content library
│   │   ├── scheduler/     # Day 27: Post scheduler
│   │   ├── analytics/     # Day 33: Analytics dashboard
│   │   └── settings/      # Day 40: Account & billing
│   └── api/               # API routes
│       ├── upload/        # Day 5: Upload handler
│       ├── transform/     # Day 8-9: Resize pipeline
│       ├── ai/            # Day 15-20: AI features
│       ├── posts/         # Day 27: Publisher
│       └── cron/          # Scheduled jobs
├── components/
│   ├── layout/            # Sidebar, Navbar
│   ├── dashboard/         # Feature components
│   └── ui/                # Reusable primitives
├── lib/
│   ├── supabase/          # client.ts, server.ts
│   ├── constants/         # Platform specs
│   └── utils/             # cn(), helpers
├── types/
│   └── database.ts        # Supabase type definitions
supabase/
└── migrations/
    └── 001_initial_schema.sql
```

## Day-by-Day Build Plan

See your Notion Kanban board for the full 56-day plan with code snippets.

The Kanban database ID is: `fd64371c-21c4-4640-8f84-4b296dcaa54d`
