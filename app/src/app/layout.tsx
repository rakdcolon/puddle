import type { Metadata } from 'next'
import { Crimson_Pro } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import DiscordActivityProvider from '@/components/discord/DiscordActivityProvider'
import ThemeWatcher from '@/components/theme/ThemeWatcher'
import A11yWatcher from '@/components/a11y/A11yWatcher'
import { THEME_INIT_SCRIPT } from '@/lib/theme'
import { A11Y_INIT_SCRIPT } from '@/lib/a11y'
import './globals.css'

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-crimson',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://solvepuddle.com'),
  title: 'puddle: a daily puzzle column',
  description:
    'A new daily puzzle every morning. Logic, wordplay, lateral thinking, quant, and more. Free, no signup needed.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'puddle',
    title: 'puddle: a daily puzzle column',
    description:
      'A new daily puzzle every morning. Logic, wordplay, lateral thinking, quant, and more.',
    images: ['/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'puddle: a daily puzzle column',
    description:
      'A new daily puzzle every morning. Logic, wordplay, lateral thinking, quant, and more.',
    images: ['/og-default.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${crimsonPro.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* theme-color must precede the init script, which updates it in place. */}
        <meta name="theme-color" content="#f5ecdb" />
        {/* Set the theme class before paint to avoid a flash of the wrong mode. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Likewise set accessibility classes before paint (no flash of serif / low contrast). */}
        <script dangerouslySetInnerHTML={{ __html: A11Y_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink antialiased" style={{ fontFamily: 'var(--font-app)' }}>
        <ThemeWatcher />
        <A11yWatcher />
        <DiscordActivityProvider>{children}</DiscordActivityProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
