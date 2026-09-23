'use client'

import Image from 'next/image'
import type { CSSProperties } from 'react'
import type { BabyStage } from '@/data/campaign'
import type { Product } from '@/data/products'
import { asset } from '@/lib/asset'
import { peso } from '@/lib/format'
import { PlusIcon, SparklesIcon } from './icons'
import { stageTone } from './ui'

interface Props {
  items: Product[]
  remaining: number
  onAdd: (id: string) => void
  /** Tints the thumbnails with her stage's colour. */
  stage?: BabyStage
}

export default function Suggestions({ items, remaining, onAdd, stage }: Props) {
  if (items.length === 0) return null

  const addsTo = items.reduce((s, p) => s + p.price, 0)
  const single = items.length === 1
  const well = stage ? stageTone(stage).tint : 'bg-sky-soft'

  return (
    <section aria-labelledby="suggestions-heading" className="rounded-card border border-gold/25 bg-cream-soft p-4 shadow-soft">
      <h2 id="suggestions-heading" className="flex items-center gap-2 font-display text-[15px] font-extrabold text-ink">
        <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-cream text-gold">
          <SparklesIcon size={16} />
        </span>
        Almost there
      </h2>

      <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">
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

      <ul className="stagger mt-3 flex flex-col gap-2">
        {items.map((p, i) => (
          <li key={p.id} style={{ '--i': i } as CSSProperties}>
            <button
              type="button"
              onClick={() => onAdd(p.id)}
              className="press flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-ink/10 bg-white px-3 py-2 text-left shadow-soft hover:border-gold/50 active:bg-cream-soft"
            >
              <span className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-xl ${well}`}>
                <Image src={asset(p.image)} alt="" fill sizes="44px" className="object-contain p-1" loading="lazy" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink">{p.name}</span>
                {p.size && <span className="text-xs text-ink-soft/90">{p.size}</span>}
              </span>
              <span className="shrink-0 font-display text-[15px] font-extrabold tabular-nums text-blue">{peso(p.price)}</span>
              <span
                aria-hidden="true"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-blue text-white"
              >
                <PlusIcon size={16} strokeWidth={2.5} />
              </span>
              <span className="sr-only">Add {p.name} to your basket</span>
            </button>
          </li>
        ))}
      </ul>

      {!single && <p className="mt-2.5 text-[11.5px] text-ink-soft/90">Together they add {peso(addsTo)}.</p>}
    </section>
  )
}
