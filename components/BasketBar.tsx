'use client'

import { campaign } from '@/data/campaign'
import { peso } from '@/lib/format'
import { BagIcon, GiftIcon } from './icons'
import { Button } from './ui'

interface Props {
  count: number
  units: number
  total: number
  remaining: number
  unlocked: boolean
  onOpen: () => void
}

export default function BasketBar({ count, units, total, remaining, unlocked, onOpen }: Props) {
  const pct = Math.min(100, Math.round((total / campaign.rewardThreshold) * 100))

  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div
        className={`border-t shadow-bar ${
          unlocked ? 'border-gold/30 bg-cream' : 'border-ink/10 bg-white/95 backdrop-blur'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="h-1 w-full bg-sky">
          <div
            className={`progress-fill h-full ${unlocked ? 'bg-gradient-to-r from-gold-soft to-gold' : 'bg-blue'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-2.5 md:max-w-3xl lg:max-w-6xl lg:px-8">
          <div className="min-w-0 flex-1">
            <p
              className={`flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide ${
                unlocked ? 'text-gold' : 'text-ink-soft/75'
              }`}
            >
              {unlocked ? <GiftIcon size={14} /> : <BagIcon size={14} />}
              <span className="truncate">{unlocked ? 'Gift unlocked' : 'Your nesting basket'}</span>
            </p>
            <p className="font-display text-[22px] font-extrabold leading-tight tabular-nums text-ink">
              {/* Re-mounted on change so the total bumps. */}
              <span key={total} className="animate-bump inline-block">
                {peso(total)}
              </span>
            </p>
            <p className="truncate text-[11.5px] leading-tight text-ink-soft">
              {unlocked
                ? `${campaign.rewardShortName} unlocked`
                : count === 0
                  ? 'Add your first essential'
                  : `${peso(remaining)} more to unlock your gift`}
            </p>
          </div>

          <Button
            variant={unlocked ? 'gold' : 'primary'}
            onClick={onOpen}
            className="relative shrink-0"
            iconRight={
              units > 0 ? (
                <span className="absolute -right-1 -top-1.5 grid h-6 min-w-6 place-items-center rounded-pill bg-ink px-1.5 text-[11.5px] font-bold tabular-nums text-white ring-2 ring-white">
                  {units}
                </span>
              ) : undefined
            }
          >
            View basket
          </Button>
        </div>
      </div>

      {/* Screen-reader summary of the basket. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {units} {units === 1 ? 'item' : 'items'}. Total {peso(total)}.{' '}
        {unlocked ? 'Gift unlocked.' : `${peso(remaining)} more to unlock your gift.`}
      </p>
    </div>
  )
}
