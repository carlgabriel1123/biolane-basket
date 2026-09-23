'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import type { Product } from '@/data/products'
import { asset } from '@/lib/asset'
import { peso } from '@/lib/format'
import QtyStepper from './QtyStepper'

interface Props {
  product: Product
  qty: number
  onChange: (id: string, qty: number) => void
  /** Highlight ring used by the "almost there" suggestions. */
  suggested?: boolean
  priority?: boolean
}

export default function ProductCard({
  product,
  qty,
  onChange,
  suggested = false,
  priority = false,
}: Props) {
  const [showWhy, setShowWhy] = useState(false)
  const whyId = useId()
  const inBasket = qty > 0

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
      <button
        type="button"
        onClick={() => setShowWhy((v) => !v)}
        aria-expanded={showWhy}
        aria-controls={whyId}
        aria-label={`Why choose ${product.name}?`}
        className="absolute right-1.5 top-1.5 z-10 grid h-11 w-11 place-items-center rounded-full text-ink-soft/70 transition-colors hover:bg-sky-soft hover:text-blue active:bg-sky"
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10 14.2v-.01M10 11.3c0-1.5 1.9-1.7 1.9-3.2A1.9 1.9 0 0 0 8.2 7.6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        {/* Packshot, with a tick once it's in her basket */}
        <div className="relative h-[76px] w-[76px] shrink-0 sm:h-20 sm:w-20">
          <div className="relative h-full w-full overflow-hidden rounded-xl bg-sky-soft">
            <Image
              src={asset(product.image)}
              alt={`${product.name}${product.size ? ' ' + product.size : ''}`}
              fill
              sizes="80px"
              className="object-contain p-1.5"
              priority={priority}
              loading={priority ? undefined : 'lazy'}
            />
          </div>
          {inBasket && (
            <span
              aria-hidden="true"
              className="animate-pop absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-blue text-white ring-2 ring-white"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                <path
                  d="M3.5 8.4l3 3 6-6.4"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="pr-9 font-display text-[15px] font-bold leading-snug text-ink sm:text-base">
            {product.name}
          </h3>
          {product.size && (
            <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-ink-soft/70">
              {product.size}
            </p>
          )}
          <p className="mt-1 text-[13px] leading-snug text-ink-soft">{product.blurb}</p>

          {/* Price on the left, Add / stepper on the right; wraps on narrow cards. */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p className="flex items-baseline gap-1.5">
              <span className="font-display text-lg font-extrabold text-blue">
                {peso(product.price)}
              </span>
              {product.origPrice > product.price && (
                <span className="text-xs text-ink-soft/55 line-through">
                  {peso(product.origPrice)}
                </span>
              )}
            </p>

            {inBasket ? (
              <QtyStepper name={product.name} qty={qty} onChange={step} plusRef={plusRef} />
            ) : (
              <button
                ref={addRef}
                type="button"
                onClick={add}
                aria-label={`Add ${product.name}${product.size ? ' ' + product.size : ''}`}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-2 border-blue px-5 text-[14px] font-bold text-blue transition-colors hover:bg-blue hover:text-white active:bg-blue-deep active:text-white"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
                Add
              </button>
            )}
          </div>
        </div>
      </div>

      {showWhy && (
        <div
          id={whyId}
          className="animate-rise mx-3 mb-3 rounded-xl bg-sky-soft px-3 py-2.5 text-[13px] leading-relaxed text-ink-soft sm:mx-4 sm:mb-4"
        >
          {product.whyThis}
        </div>
      )}
    </div>
  )
}
