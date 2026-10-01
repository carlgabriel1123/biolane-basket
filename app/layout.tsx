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
  title: 'Biolane Checklist',
  description:
    "Build your baby's Biolane essentials and unlock your free personalized toiletry bag.",
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

// Runs before the first paint. When this tab already has a checklist or a
// claim code going, the server's sign-up form stays hidden until ChecklistApp
// has put the saved screen back, so a refresh never flashes an empty form.
// Only on the checklist page itself (not /admin). A page script that fails
// to load (now, or before this ran, e.g. blocked) shows the page at once
// instead of waiting for the CSS fail-safe.
const HOME = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const RESTORE_FLAG = `try{var p=location.pathname;if(p==='${HOME}/'||p==='${HOME}'){var s=JSON.parse(sessionStorage.getItem('biolane-nesting-session')||'null');if(s&&(s.step==='checklist'||s.step==='done')){var h=document.documentElement;h.setAttribute('data-restoring','');document.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='SCRIPT'&&(t.src||'').indexOf('/_next/')>=0)h.removeAttribute('data-restoring')},true);[].forEach.call(document.querySelectorAll('script[src*="/_next/"]'),function(c){if(c.src.indexOf(location.origin+'/')!==0)return;var r=performance.getEntriesByName(c.src);if(r.length&&r[r.length-1].responseStatus===0)h.removeAttribute('data-restoring')})}}}catch(e){}`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-PH" className={`${nunito.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: RESTORE_FLAG }} />
      </head>
      {/* next/font self-hosts both families, so no third-party font origin is ever contacted. */}
      <body>{children}</body>
    </html>
  )
}
