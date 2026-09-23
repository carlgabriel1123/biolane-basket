'use client'

import { campaign } from '@/data/campaign'
import { peso } from '@/lib/format'

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
              className={`text-[11px] font-semibold uppercase tracking-wide ${
                unlocked ? 'text-gold' : 'text-ink-soft/75'
              }`}
            >
              {unlocked ? (
                <>
                  <span aria-hidden="true">🎉</span> Gift unlocked
                </>
              ) : (
                <>
                  <span aria-hidden="true">🛍️</span> Your nesting basket
                </>
              )}
            </p>
            <p className="font-display text-[22px] font-extrabold leading-tight tabular-nums text-ink">
              {peso(total)}
            </p>
            <p className="truncate text-[11.5px] leading-tight text-ink-soft">
              {unlocked
                ? `${campaign.rewardShortName} unlocked`
                : count === 0
                  ? 'Add your first essential'
                  : `${peso(remaining)} more to unlock your gift`}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className={`relative min-h-[48px] shrink-0 rounded-full px-5 text-[14px] font-bold text-white transition-colors ${
              unlocked ? 'bg-gold hover:bg-[#ad7b14]' : 'bg-blue hover:bg-blue-deep'
            }`}
          >
            View basket
            {units > 0 && (
              <span className="absolute -right-1 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 text-[11.5px] font-bold tabular-nums text-white ring-2 ring-white">
                {units}
              </span>
            )}
          </button>
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
