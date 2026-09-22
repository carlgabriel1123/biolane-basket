'use client'

import { campaign } from '@/data/campaign'
import { peso } from '@/lib/format'

interface Props {
  count: number
  total: number
  remaining: number
  unlocked: boolean
  onContinue: () => void
  /** Hidden until the mom has actually started, so the hero stays clean. */
  visible: boolean
}

export default function BasketBar({
  count,
  total,
  remaining,
  unlocked,
  onContinue,
  visible,
}: Props) {
  const pct = Math.min(100, Math.round((total / campaign.rewardThreshold) * 100))

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      // The bar is a live summary; announce changes politely, not on every tap.
      aria-hidden={!visible}
    >
      <div
        className={`border-t shadow-bar ${
          unlocked ? 'border-gold/30 bg-cream' : 'border-ink/10 bg-white/95 backdrop-blur'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Slim progress strip along the very top edge of the bar. */}
        <div className="h-1 w-full bg-sky">
          <div
            className={`progress-fill h-full ${
              unlocked ? 'bg-gradient-to-r from-gold-soft to-gold' : 'bg-blue'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            {unlocked ? (
              <p className="font-display text-[13px] font-extrabold uppercase tracking-wide text-gold">
                <span aria-hidden="true">🎉</span> Gift unlocked
              </p>
            ) : (
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft/75">
                <span aria-hidden="true">🛍️</span> Your nesting basket
              </p>
            )}

            <p className="font-display text-[22px] font-extrabold leading-tight tabular-nums text-ink">
              {peso(total)}
            </p>

            <p className="truncate text-[11.5px] leading-tight text-ink-soft">
              {unlocked
                ? `${campaign.rewardShortName} unlocked`
                : count === 0
                  ? 'Tick the boxes to start'
                  : `${peso(remaining)} more to unlock your gift`}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] font-medium text-ink-soft/70">
              {count} {count === 1 ? 'essential' : 'essentials'}
            </p>
            <button
              type="button"
              onClick={onContinue}
              disabled={count === 0}
              className={`mt-1 min-h-[44px] rounded-full px-5 text-[13px] font-bold transition-colors ${
                count === 0
                  ? 'cursor-not-allowed bg-sky text-ink-soft/50'
                  : unlocked
                    ? 'bg-gold text-white hover:bg-[#ad7b14]'
                    : 'bg-blue text-white hover:bg-blue-deep'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      {/* Screen-reader-only live total, so a blind user hears the basket change. */}
      <p className="sr-only" aria-live="polite">
        {count} selected. Total {peso(total)}.{' '}
        {unlocked ? 'Gift unlocked.' : `${peso(remaining)} more to unlock your gift.`}
      </p>
    </div>
  )
}
