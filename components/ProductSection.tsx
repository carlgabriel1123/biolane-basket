'use client'

import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import type { BabyStage } from '@/data/campaign'
import type { CatalogItem } from '@/data/products'
import type { Quantities } from '@/lib/basket'
import { ChevronDownIcon } from './icons'
import { Badge, stageTone } from './ui'
import ProductCard from './ProductCard'

interface Props {
  title: string
  caption?: string
  items: CatalogItem[]
  quantities: Quantities
  suggestedIds: Set<string>
  onChange: (id: string, qty: number) => void
  /** Render as an accordion that opens and closes. */
  collapsible?: boolean
  defaultOpen?: boolean
  /** Section wash. `stage` uses her stage's own tint. */
  tone?: 'plain' | 'blush' | 'sky' | 'stage'
  priorityFirst?: boolean
  /** Heading level for this section's title; product names go one below. */
  headingLevel?: 2 | 3
  /** Use this id on the title, e.g. so a wrapper can be labelled by it. */
  headingId?: string
  /** Her stage: colours the heading mark and every card's image well. */
  stage?: BabyStage
  /** Icon shown beside a non-collapsible heading (defaults to the stage's icon). */
  icon?: ReactNode
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
  headingId: headingIdProp,
  stage,
  icon,
}: Props) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  const cardLevel = headingLevel === 3 ? 4 : 3
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  const autoHeadingId = useId()
  const headingId = headingIdProp ?? autoHeadingId
  const inBasket = items.filter((p) => (quantities[p.id] ?? 0) > 0).length
  const isOpen = collapsible ? open : true
  const t = stageTone(stage ?? '')
  const StageIcon = t.Icon
  const mark = icon ?? (stage ? <StageIcon size={20} /> : null)

  const grid = (
    <div
      id={panelId}
      className={
        items.length > 1
          ? 'stagger grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3 lg:grid-cols-1 xl:grid-cols-2'
          : 'stagger grid grid-cols-1 gap-2.5'
      }
    >
      {items.map((product, i) => (
        /* Each card rises in 40 ms after the one before it. */
        <div key={product.id} className="min-w-0" style={{ '--i': i } as CSSProperties}>
          <ProductCard
            product={product}
            qty={quantities[product.id] ?? 0}
            suggested={suggestedIds.has(product.id)}
            onChange={onChange}
            priority={priorityFirst && i < 2}
            headingLevel={cardLevel}
            stage={stage}
          />
        </div>
      ))}
    </div>
  )

  const shell =
    tone === 'blush'
      ? 'rounded-card border border-blush bg-blush-soft p-3 sm:p-4'
      : tone === 'sky'
        ? 'rounded-card border border-sky bg-sky-soft p-3 sm:p-4'
        : tone === 'stage'
          ? `rounded-card border border-ink/10 ${t.bg} p-3 sm:p-4`
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
            className="press press-lg flex min-h-[48px] w-full items-center gap-3 rounded-2xl text-left"
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
            <Badge tone="soft" className="shrink-0 tabular-nums">
              {inBasket > 0 ? `${inBasket} of ${items.length} added` : `${items.length}`}
            </Badge>
            <ChevronDownIcon
              size={20}
              className={`shrink-0 text-ink-soft transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </Heading>
      ) : (
        <div className="mb-3 flex items-start gap-3">
          {mark && (
            <span
              aria-hidden="true"
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-pill ${t.tint} ${t.text}`}
            >
              {mark}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <Heading id={headingId} className="font-display text-[17px] font-extrabold leading-snug text-ink md:text-xl">
              {title}
            </Heading>
            {caption && <p className="mt-1 text-[13px] leading-snug text-ink-soft">{caption}</p>}
          </div>
        </div>
      )}

      {isOpen && <div className={collapsible ? 'mt-3' : ''}>{grid}</div>}
    </section>
  )
}
