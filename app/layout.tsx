import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' })

export const metadata: Metadata = {
  title: 'RelayAI — AI access, when you need it',
  description: 'A marketplace concept for flexible access to premium AI tools. Pay for the access you need and Get more value from subscriptions you purchase from us.',
  generator: 'v0.app',
  openGraph: {
    title: 'RelayAI — AI access, when you need it',
    description: 'Flexible access to premium AI tools, designed around the way people actually use them.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f2f0eb',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`bg-background ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <GoogleAnalytics />
      </body>
    </html>
  )
}
