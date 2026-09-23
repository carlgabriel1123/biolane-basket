'use client'

import Image from 'next/image'
import type { Product } from '@/data/products'
import { asset } from '@/lib/asset'
import { peso } from '@/lib/format'

interface Props {
  items: Product[]
  remaining: number
  onAdd: (id: string) => void
}

export default function Suggestions({ items, remaining, onAdd }: Props) {
  if (items.length === 0) return null

  const addsTo = items.reduce((s, p) => s + p.price, 0)
  const single = items.length === 1

  return (
    <section aria-labelledby="suggestions-heading" className="rounded-card border border-gold/25 bg-cream-soft p-4">
      <h2 id="suggestions-heading" className="font-display text-[15px] font-extrabold text-ink">
        Almost there, Mommy <span aria-hidden="true">💛</span>
      </h2>

      <p className="mt-1 text-[13px] leading-snug text-ink-soft">
        {single ? (
          <>
            Adding <span className="font-semibold text-ink">{items[0].name}</span> puts you over the
            line.
          </>
        ) : (
          <>
            {peso(remaining)} to go — these {items.length} would complete your basket.
          </>
        )}
      </p>

      <ul className="mt-3 flex flex-col gap-2">
        {items.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onAdd(p.id)}
              className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-ink/10 bg-white px-3 py-2 text-left transition-colors hover:border-gold/50 active:bg-cream-soft"
            >
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sky-soft">
                <Image src={asset(p.image)} alt="" fill sizes="40px" className="object-contain p-1" loading="lazy" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink">{p.name}</span>
                {p.size && <span className="text-xs text-ink-soft/75">{p.size}</span>}
              </span>
              <span className="shrink-0 font-display text-[15px] font-extrabold text-blue">{peso(p.price)}</span>
              <span
                aria-hidden="true"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue text-lg font-bold leading-none text-white"
              >
                +
              </span>
              <span className="sr-only">Add {p.name} to your basket</span>
            </button>
          </li>
        ))}
      </ul>

      {!single && <p className="mt-2.5 text-[11.5px] text-ink-soft/70">Together they add {peso(addsTo)}.</p>}
    </section>
  )
}
