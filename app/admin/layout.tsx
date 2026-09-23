import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Biolane Admin',
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-sky-soft/40">{children}</div>
}
