import type { Metadata, Viewport } from 'next'
import { Nunito, Inter } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Biolane Nesting Checklist | Grand Baby Fair',
  description:
    "Build your baby's Biolane essentials and unlock your free personalized toiletry bag at the Grand Baby Fair.",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#003b61',
  width: 'device-width',
  initialScale: 1,
  // Moms and BAs must be able to zoom. Never lock this down.
  maximumScale: 5,
  // Lets env(safe-area-inset-bottom) keep the basket bar above the iPhone home indicator.
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-PH" className={`${nunito.variable} ${inter.variable}`}>
      {/* next/font self-hosts both families, so no third-party font origin is ever contacted. */}
      <body>{children}</body>
    </html>
  )
}
