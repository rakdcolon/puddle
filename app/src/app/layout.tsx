import type { Metadata } from 'next'
import { Crimson_Pro } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import DiscordActivityProvider from '@/components/discord/DiscordActivityProvider'
import ThemeWatcher from '@/components/theme/ThemeWatcher'
import { THEME_INIT_SCRIPT } from '@/lib/theme'
import './globals.css'

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-crimson',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'puddle — a daily puzzle column',
  description: 'One puzzle a day. Logic, deduction, wordplay, and more.',
  openGraph: {
    title: 'puddle — a daily puzzle column',
    description: 'One puzzle a day. Logic, deduction, wordplay, and more.',
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
        {/* Set the theme class before paint to avoid a flash of the wrong mode. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink antialiased" style={{ fontFamily: 'var(--font-crimson), "Iowan Old Style", Georgia, serif' }}>
        <ThemeWatcher />
        <DiscordActivityProvider>{children}</DiscordActivityProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
