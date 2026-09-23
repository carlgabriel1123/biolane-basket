import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

// Fonts are stored in the repo (app/fonts, from @fontsource-variable) rather
// than fetched from Google Fonts at build time — that fetch kept failing on
// the build servers and broke deploys.
const nunito = localFont({
  src: './fonts/nunito-latin-wght-normal.woff2',
  weight: '200 1000',
  variable: '--font-nunito',
  display: 'swap',
})

const inter = localFont({
  src: './fonts/inter-latin-wght-normal.woff2',
  weight: '100 900',
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
