import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Velocast — Upload Once, Publish Everywhere',
    template: '%s | Velocast',
  },
  description:
    'AI-powered content management for creators. Auto-resize, caption, subtitle, and publish your content across every platform — in one click.',
  keywords: ['content creator', 'social media', 'AI captions', 'video editing', 'scheduler'],
  authors: [{ name: 'Velocast' }],
  openGraph: {
    title: 'Velocast — Upload Once, Publish Everywhere',
    description: 'AI-powered multi-platform content management for creators.',
    url: 'https://velocast.app',
    siteName: 'Velocast',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Velocast',
    description: 'AI-powered multi-platform content management for creators.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="bg-surface text-white antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#16162a',
              border: '1px solid #2a2a45',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}
