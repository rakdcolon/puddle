import type { Metadata } from 'next'
import { Crimson_Pro } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
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
    <html lang="en" className={`${crimsonPro.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-bg text-ink antialiased" style={{ fontFamily: 'var(--font-crimson), "Iowan Old Style", Georgia, serif' }}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
