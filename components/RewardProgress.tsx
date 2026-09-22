'use client'

import { campaign } from '@/data/campaign'
import { peso } from '@/lib/format'

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
      className="rounded-card border border-ink/10 bg-white p-4 shadow-soft"
    >
      <h2 id="reward-progress-heading" className="sr-only">
        Reward progress
      </h2>

      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-sm font-bold text-ink">
          {unlocked ? 'Gift unlocked' : 'Your progress'}
        </span>
        <span className="text-[13px] font-semibold tabular-nums text-ink-soft">
          {peso(total)} / {peso(campaign.rewardThreshold)}
        </span>
      </div>

      <div
        className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-sky"
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
          className={`progress-fill h-full rounded-full ${
            unlocked
              ? 'bg-gradient-to-r from-gold-soft to-gold'
              : 'bg-gradient-to-r from-blue to-blue-deep'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-2.5 text-[13px] leading-snug text-ink-soft">
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
    </section>
  )
}
