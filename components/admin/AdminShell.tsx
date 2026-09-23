import Image from 'next/image'
import { asset } from '@/lib/asset'

/** Centered card layout for the setup and login screens. */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <Image
          src={asset('/images/brand/biolane-logo.png')}
          alt="Biolane"
          width={547}
          height={159}
          priority
          className="mx-auto h-auto w-[150px]"
        />
        <p className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-ink-soft/70">Booth dashboard</p>
      </div>
      {children}
    </main>
  )
}
