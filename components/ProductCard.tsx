'use client'

import Image from 'next/image'
import { useId, useState } from 'react'
import type { Product } from '@/data/products'
import { asset } from '@/lib/asset'
import { peso } from '@/lib/format'

interface Props {
  product: Product
  selected: boolean
  onToggle: (id: string) => void
  /** Highlight ring used by the "almost there" suggestions. */
  suggested?: boolean
  priority?: boolean
}

export default function ProductCard({
  product,
  selected,
  onToggle,
  suggested = false,
  priority = false,
}: Props) {
  const [showWhy, setShowWhy] = useState(false)
  const whyId = useId()

  return (
    <div
      className={[
        'relative rounded-card border bg-white transition-all duration-200',
        selected
          ? 'border-blue ring-2 ring-blue/30 shadow-lift'
          : suggested
            ? 'border-gold/60 ring-2 ring-gold/25 shadow-soft'
            : 'border-ink/10 shadow-soft',
      ].join(' ')}
    >
      {/* "Why this?" — kept outside the label so it is not a nested control. */}
      <button
        type="button"
        onClick={() => setShowWhy((v) => !v)}
        aria-expanded={showWhy}
        aria-controls={whyId}
        aria-label={`Why choose ${product.name}?`}
        className="absolute right-2 top-2 z-10 grid h-11 w-11 place-items-center rounded-full text-ink-soft/70 transition-colors hover:bg-sky-soft hover:text-blue active:bg-sky"
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

      <label className="flex cursor-pointer items-center gap-3 p-3 pr-14 sm:gap-4 sm:p-4 sm:pr-16">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(product.id)}
          className="peer sr-only"
        />

        {/* Checkbox — 28px box inside a 44px touch column. */}
        <span className="grid h-11 w-11 shrink-0 place-items-center">
          <span
            aria-hidden="true"
            className={[
              'grid h-7 w-7 place-items-center rounded-lg border-2 transition-all duration-150',
              selected
                ? 'border-blue bg-blue scale-100'
                : 'border-ink/25 bg-white peer-hover:border-blue/60',
            ].join(' ')}
          >
            <svg
              viewBox="0 0 16 16"
              className={`h-4 w-4 text-white transition-opacity duration-150 ${
                selected ? 'opacity-100' : 'opacity-0'
              }`}
              fill="none"
            >
              <path
                d="M3.5 8.4l3 3 6-6.4"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>

        {/* Packshot */}
        <span className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-sky-soft sm:h-20 sm:w-20">
          <Image
            src={asset(product.image)}
            alt={`${product.name} ${product.size}`}
            fill
            sizes="80px"
            className="object-contain p-1.5"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
          />
        </span>

        {/* Text */}
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] font-bold leading-snug text-ink sm:text-base">
            {product.name}
          </span>
          <span className="mt-0.5 block text-xs font-medium uppercase tracking-wide text-ink-soft/70">
            {product.size}
          </span>
          <span className="mt-1 flex items-baseline gap-1.5">
            <span className="font-display text-lg font-extrabold text-blue">
              {peso(product.price)}
            </span>
            {product.origPrice > product.price && (
              <span className="text-xs text-ink-soft/55 line-through">
                {peso(product.origPrice)}
              </span>
            )}
          </span>
          <span className="mt-1 block text-[13px] leading-snug text-ink-soft">
            {product.blurb}
          </span>
        </span>
      </label>

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
