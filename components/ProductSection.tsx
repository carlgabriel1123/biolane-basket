'use client'

import { useId, useState } from 'react'
import type { Product } from '@/data/products'
import type { Quantities } from '@/lib/basket'
import ProductCard from './ProductCard'

interface Props {
  title: string
  caption?: string
  items: Product[]
  quantities: Quantities
  suggestedIds: Set<string>
  onChange: (id: string, qty: number) => void
  /** Render as an accordion that opens and closes. */
  collapsible?: boolean
  defaultOpen?: boolean
  tone?: 'plain' | 'blush'
  priorityFirst?: boolean
  /** Heading level for this section's title; product names go one below. */
  headingLevel?: 2 | 3
}

export default function ProductSection({
  title,
  caption,
  items,
  quantities,
  suggestedIds,
  onChange,
  collapsible = false,
  defaultOpen = true,
  tone = 'plain',
  priorityFirst = false,
  headingLevel = 2,
}: Props) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  const cardLevel = headingLevel === 3 ? 4 : 3
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  const headingId = useId()
  const inBasket = items.filter((p) => (quantities[p.id] ?? 0) > 0).length
  const isOpen = collapsible ? open : true

  const grid = (
    <div
      id={panelId}
      className={
        items.length > 1
          ? 'grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3 lg:grid-cols-1 xl:grid-cols-2'
          : 'grid grid-cols-1 gap-2.5'
      }
    >
      {items.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          qty={quantities[product.id] ?? 0}
          suggested={suggestedIds.has(product.id)}
          onChange={onChange}
          priority={priorityFirst && i < 2}
          headingLevel={cardLevel}
        />
      ))}
    </div>
  )

  const shell =
    tone === 'blush'
      ? 'rounded-card border border-blush bg-blush-soft p-3 sm:p-4'
      : collapsible
        ? 'rounded-card border border-ink/10 bg-white/70 p-3 sm:p-4'
        : ''

  return (
    <section aria-labelledby={headingId} className={shell}>
      {collapsible ? (
        <Heading id={headingId} className="m-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={isOpen}
            aria-controls={panelId}
            className="flex min-h-[48px] w-full items-center gap-3 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[16px] font-extrabold leading-snug text-ink">
                {title}
              </span>
              {caption && (
                <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-soft">
                  {caption}
                </span>
              )}
            </span>
            <span className="shrink-0 rounded-full bg-sky-soft px-2.5 py-1 text-[11.5px] font-semibold tabular-nums text-ink-soft">
              {inBasket > 0 ? `${inBasket} of ${items.length} added` : `${items.length}`}
            </span>
            <svg
              viewBox="0 0 20 20"
              className={`h-5 w-5 shrink-0 text-ink-soft transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              aria-hidden="true"
            >
              <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </Heading>
      ) : (
        <div className="mb-3">
          <Heading id={headingId} className="font-display text-[17px] font-extrabold leading-snug text-ink md:text-xl">
            {title}
          </Heading>
          {caption && <p className="mt-1 text-[13px] leading-snug text-ink-soft">{caption}</p>}
        </div>
      )}

      {isOpen && <div className={collapsible ? 'mt-3' : ''}>{grid}</div>}
    </section>
  )
}
