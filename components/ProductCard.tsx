'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import type { BabyStage } from '@/data/campaign'
import { isPriced, type CatalogItem } from '@/data/products'
import { asset } from '@/lib/asset'
import { peso } from '@/lib/format'
import { CheckIcon, HelpCircleIcon, InfoIcon, PlusIcon } from './icons'
import { Badge, IconButton, stageTone } from './ui'
import QtyStepper from './QtyStepper'

interface Props {
  product: CatalogItem
  qty: number
  onChange: (id: string, qty: number) => void
  /** Highlight ring used by the "almost there" suggestions. */
  suggested?: boolean
  priority?: boolean
  /** Level of the product name heading (one below its section's heading). */
  headingLevel?: 3 | 4
  /** Tints the image well with her stage's colour. */
  stage?: BabyStage
}

export default function ProductCard({
  product,
  qty,
  onChange,
  suggested = false,
  priority = false,
  headingLevel = 3,
  stage,
}: Props) {
  const [showWhy, setShowWhy] = useState(false)
  const whyId = useId()
  // Not on the fair price list yet: shown in place, but can't be added.
  const priced = isPriced(product) ? product : null
  const inBasket = qty > 0
  const Heading = headingLevel === 4 ? 'h4' : 'h3'
  // Two products share a name in different sizes (Pure H2O 350 / 750), so
  // every control's label includes the size.
  const fullName = product.size ? `${product.name} ${product.size}` : product.name
  const well = stage ? stageTone(stage).tint : 'bg-sky-soft'

  // Add and the stepper replace each other, so the button she just used
  // disappears. Hand focus to its replacement instead of dropping it.
  const addRef = useRef<HTMLButtonElement>(null)
  const plusRef = useRef<HTMLButtonElement>(null)
  const pendingFocus = useRef<'plus' | 'add' | null>(null)

  useEffect(() => {
    const target = pendingFocus.current
    pendingFocus.current = null
    if (target === 'plus') plusRef.current?.focus({ preventScroll: true })
    if (target === 'add') addRef.current?.focus({ preventScroll: true })
  }, [inBasket])

  const add = () => {
    pendingFocus.current = 'plus'
    onChange(product.id, 1)
  }

  const step = (n: number) => {
    if (n <= 0) pendingFocus.current = 'add'
    onChange(product.id, n)
  }

  return (
    <div
      id={`product-${product.id}`}
      className={[
        'relative scroll-mt-24 rounded-card border bg-white transition-[border-color,box-shadow] duration-200',
        inBasket
          ? 'border-blue ring-2 ring-blue/25 shadow-lift'
          : suggested
            ? 'border-gold/60 ring-2 ring-gold/25 shadow-soft'
            : 'border-ink/10 shadow-soft',
      ].join(' ')}
    >
      {/* "Why this?" — the BA talking point. */}
      <IconButton
        onClick={() => setShowWhy((v) => !v)}
        aria-expanded={showWhy}
        aria-controls={whyId}
        aria-label={`Why choose ${fullName}?`}
        className="absolute right-1.5 top-1.5 z-10 aria-expanded:bg-sky-soft aria-expanded:text-blue"
      >
        <HelpCircleIcon size={20} />
      </IconButton>

      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        {/* Packshot in a stage-tinted well, with a tick once it's in her basket */}
        <div className="relative h-[88px] w-[88px] shrink-0">
          <div className={`relative h-full w-full overflow-hidden rounded-2xl ${well}`}>
            <Image
              src={asset(product.image)}
              alt={fullName}
              fill
              sizes="88px"
              className="object-contain p-2"
              priority={priority}
              loading={priority ? undefined : 'lazy'}
            />
          </div>
          {inBasket && (
            <span
              aria-hidden="true"
              className="animate-pop absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-pill bg-ink text-white ring-2 ring-white"
            >
              <CheckIcon size={14} strokeWidth={3} />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <Heading className="pr-10 font-display text-[15px] font-bold leading-snug text-ink sm:text-base">
            {product.name}
          </Heading>
          {product.size && (
            <p className="mt-1">
              <Badge tone="soft">{product.size}</Badge>
            </p>
          )}
          <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">{product.blurb}</p>

          {/* Price on the left, Add / stepper on the right; wraps on narrow cards. */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            {priced ? (
              <p className="flex items-baseline gap-1.5">
                <span className="font-display text-lg font-extrabold tabular-nums text-blue">
                  {peso(priced.price)}
                </span>
                {priced.origPrice > priced.price && (
                  <span className="text-xs tabular-nums text-ink-soft/80 line-through">
                    {peso(priced.origPrice)}
                  </span>
                )}
              </p>
            ) : (
              <p className="font-display text-[14px] font-bold text-ink-soft">Price at the booth</p>
            )}

            {!priced ? (
              <span className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border-2 border-dashed border-ink/20 px-4 text-[13px] font-semibold text-ink-soft">
                <InfoIcon size={16} />
                Ask our team
              </span>
            ) : inBasket ? (
              <QtyStepper name={fullName} qty={qty} onChange={step} plusRef={plusRef} />
            ) : (
              /* A plain button (not <Button>) so the focus hand-off ref can land on it;
                 styled as Button secondary/sm with a 44px target. */
              <button
                ref={addRef}
                type="button"
                onClick={add}
                aria-label={`Add ${fullName}`}
                className="press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-pill border-2 border-blue bg-white px-4 text-[13.5px] font-bold text-blue hover:bg-blue hover:text-white active:bg-blue-deep active:text-white"
              >
                <PlusIcon size={16} strokeWidth={2.5} />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showWhy && (
        <div
          id={whyId}
          className="animate-rise mx-3 mb-3 rounded-2xl bg-sky-soft px-3 py-2.5 text-[13px] leading-relaxed text-ink-soft sm:mx-4 sm:mb-4"
        >
          {product.whyThis}
        </div>
      )}
    </div>
  )
}
