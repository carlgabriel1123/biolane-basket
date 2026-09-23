import type { Metadata } from 'next'
import NurseryBackdrop from '@/components/NurseryBackdrop'

export const metadata: Metadata = {
  title: 'Biolane Admin',
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      {/* Same soft nursery wallpaper as the public site, calmer: fewer motifs, no motion. */}
      <NurseryBackdrop quiet />
      {children}
    </div>
  )
}
