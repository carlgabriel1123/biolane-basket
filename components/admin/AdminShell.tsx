import Image from 'next/image'
import { asset } from '@/lib/asset'
import { LockIcon } from '@/components/icons'
import { Badge } from '@/components/ui'

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
        <Badge tone="ink" icon={<LockIcon size={13} />} className="mt-3 uppercase tracking-wide">
          Booth dashboard
        </Badge>
      </div>
      <div className="animate-rise">{children}</div>
    </main>
  )
}
