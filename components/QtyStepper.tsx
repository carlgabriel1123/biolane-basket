'use client'

import type { Ref } from 'react'
import { campaign } from '@/data/campaign'
import { MinusIcon, PlusIcon, TrashIcon } from './icons'

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
      className="inline-flex items-center rounded-pill border border-blue/30 bg-white shadow-soft"
    >
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        aria-label={qty === 1 ? `Remove ${name}` : `One less ${name}`}
        className={`${box} press grid shrink-0 place-items-center rounded-pill text-ink-soft hover:bg-sky-soft active:bg-sky`}
      >
        {qty === 1 ? <TrashIcon size={18} /> : <MinusIcon size={18} />}
      </button>

      {/* Not a live region: the basket bar is the single announcer. */}
      <output
        aria-live="off"
        aria-label={`${qty} in basket`}
        className="min-w-7 text-center font-display text-[16px] font-extrabold tabular-nums text-ink"
      >
        {/* Re-mounted on every change so the number bumps. */}
        <span key={qty} className="animate-bump inline-block">
          {qty}
        </span>
      </output>

      <button
        ref={plusRef}
        type="button"
        onClick={() => onChange(qty + 1)}
        disabled={atMax}
        aria-label={atMax ? `Limit of ${campaign.maxQtyPerItem} reached` : `One more ${name}`}
        className={`${box} press grid shrink-0 place-items-center rounded-pill bg-blue text-white hover:bg-blue-deep disabled:cursor-not-allowed disabled:bg-sky disabled:text-ink-soft/50`}
      >
        <PlusIcon size={18} />
      </button>
    </div>
  )
}
