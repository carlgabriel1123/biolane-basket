'use client'

import { campaign } from '@/data/campaign'
import { peso } from '@/lib/format'
import { GiftIcon } from './icons'
import { BottleMeter } from './ui'

interface Props {
  total: number
  remaining: number
  unlocked: boolean
}

export default function RewardProgress({ total, remaining, unlocked }: Props) {
  const pct = Math.min(100, Math.round((total / campaign.rewardThreshold) * 100))

  return (
    <section
      aria-labelledby="reward-progress-heading"
      className={`rounded-card border p-4 shadow-soft ${
        unlocked ? 'border-gold/35 bg-cream' : 'border-ink/10 bg-white'
      }`}
    >
      <h2 id="reward-progress-heading" className="sr-only">
        Reward progress
      </h2>

      <div className="flex items-center gap-4">
        {/* The bottle fills as she adds; the numbers beside it do the talking. */}
        <BottleMeter pct={pct} unlocked={unlocked} className="shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-display text-sm font-bold text-ink">
            {unlocked && <GiftIcon size={16} className="text-gold" />}
            {unlocked ? 'Gift unlocked' : 'Your progress'}
          </p>

          <p className="mt-1 font-display text-[22px] font-extrabold leading-tight tabular-nums text-ink">
            {/* Re-mounted on change so the total bumps. */}
            <span key={total} className="animate-bump inline-block">
              {peso(total)}
            </span>
            <span className="text-[14px] font-bold text-ink-soft"> / {peso(campaign.rewardThreshold)}</span>
          </p>

          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-sky"
            role="progressbar"
            aria-valuenow={total}
            aria-valuemin={0}
            aria-valuemax={campaign.rewardThreshold}
            aria-valuetext={
              unlocked
                ? `Gift unlocked. Basket total ${peso(total)}.`
                : `${peso(total)} of ${peso(campaign.rewardThreshold)}. ${peso(remaining)} to go.`
            }
          >
            <div
              className={`progress-fill h-full rounded-pill ${
                unlocked
                  ? 'bg-gradient-to-r from-gold-soft to-gold'
                  : 'bg-gradient-to-r from-blue to-blue-deep'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="mt-2 text-[13px] leading-snug text-ink-soft">
            {unlocked ? (
              <span className="font-semibold text-gold">
                You&rsquo;ve unlocked your {campaign.rewardShortName}.
              </span>
            ) : (
              <>
                <span className="font-bold text-ink">{peso(remaining)} more</span> to
                unlock your gift.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  )
}
