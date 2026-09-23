'use client'

import type { Ref } from 'react'
import { campaign } from '@/data/campaign'

interface Props {
  name: string
  qty: number
  onChange: (qty: number) => void
  size?: 'md' | 'sm'
  /** Lets the parent move focus to + right after the Add button is replaced. */
  plusRef?: Ref<HTMLButtonElement>
}

/**
 * − qty + control. Minus at 1 removes the product (shown as a bin icon so
 * the outcome is visible before the tap). Every button is a 44px target.
 */
export default function QtyStepper({ name, qty, onChange, size = 'md', plusRef }: Props) {
  const atMax = qty >= campaign.maxQtyPerItem
  // Both sizes keep the 44px target; `sm` only tightens the surrounding row.
  const box = size === 'md' ? 'h-11 w-11' : 'h-11 w-11'

  return (
    <div
      role="group"
      aria-label={`${name} quantity`}
      className="inline-flex items-center rounded-full border border-blue/30 bg-white"
    >
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        aria-label={qty === 1 ? `Remove ${name}` : `One less ${name}`}
        className={`${box} grid shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-sky-soft active:bg-sky`}
      >
        {qty === 1 ? (
          <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
            <path
              d="M4.5 6h11M8 6V4.5h4V6m-6 0 .6 9.2a1 1 0 0 0 1 .8h4.8a1 1 0 0 0 1-.8L14 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
            <path d="M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Not a live region: the basket bar is the single announcer. */}
      <output
        aria-live="off"
        aria-label={`${qty} in basket`}
        className="min-w-7 text-center font-display text-[16px] font-extrabold tabular-nums text-ink"
      >
        {qty}
      </output>

      <button
        ref={plusRef}
        type="button"
        onClick={() => onChange(qty + 1)}
        disabled={atMax}
        aria-label={atMax ? `Limit of ${campaign.maxQtyPerItem} reached` : `One more ${name}`}
        className={`${box} grid shrink-0 place-items-center rounded-full bg-blue text-white transition-colors hover:bg-blue-deep disabled:cursor-not-allowed disabled:bg-sky disabled:text-ink-soft/50`}
      >
        <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
          <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
