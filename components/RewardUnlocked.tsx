'use client'

import { campaign } from '@/data/campaign'

interface Props {
  personalizationName: string
  onChangeName: (value: string) => void
  /** Max characters the bag vendor can actually print. */
  maxLength?: number
}

const ALLOWED = /^[\p{L}\p{M}\s'\-]*$/u

export default function RewardUnlocked({
  personalizationName,
  onChangeName,
  maxLength = 15,
}: Props) {
  // No focus move on unlock: she is usually mid-tap on a + button, and
  // jumping the page would lose her place. The basket bar's live region
  // announces "Gift unlocked" instead.
  const invalid = personalizationName !== '' && !ALLOWED.test(personalizationName)

  return (
    <section
      aria-labelledby="reward-unlocked-heading"
      className="animate-rise relative overflow-hidden rounded-card border border-gold/35 bg-cream p-5 text-center shadow-lift"
    >
      <div
        aria-hidden="true"
        className="reward-sheen pointer-events-none absolute inset-0"
      />

      <div className="relative">
        <p className="animate-pop text-3xl" aria-hidden="true">
          🎉
        </p>

        <h2
          id="reward-unlocked-heading"
          className="mt-1 font-display text-2xl font-extrabold text-ink"
        >
          You did it, Mommy!
        </h2>

        <p className="mt-1.5 text-[14px] text-ink-soft">
          Your Biolane nesting reward is unlocked.
        </p>

        <p className="mt-4 font-display text-[15px] font-extrabold uppercase tracking-wide text-gold">
          <span aria-hidden="true">🎁</span> Free {campaign.rewardName}
        </p>

        <div className="mt-5 rounded-xl bg-white/80 p-4 text-left">
          <label
            htmlFor="personalization"
            className="block font-display text-[14px] font-bold text-ink"
          >
            What name would you like personalized on your bag?
          </label>

          <input
            id="personalization"
            name="personalization"
            type="text"
            value={personalizationName}
            onChange={(e) => onChangeName(e.target.value)}
            maxLength={maxLength}
            autoComplete="off"
            placeholder="e.g. Sofia"
            aria-describedby="personalization-help"
            aria-invalid={invalid || undefined}
            /* 16px minimum stops iOS Safari auto-zooming on focus. */
            className="mt-2 min-h-[50px] w-full rounded-xl border-2 border-ink/15 bg-white px-4 text-[16px] font-semibold text-ink placeholder:font-normal placeholder:text-ink-soft/45 focus:border-blue focus:outline-none"
          />

          <div className="mt-1.5 flex items-start justify-between gap-3">
            <p id="personalization-help" className="text-[11.5px] text-ink-soft/75">
              {invalid
                ? 'We can only print letters, spaces, hyphens and apostrophes.'
                : 'Letters and spaces only.'}
            </p>
            <span className="shrink-0 text-[11.5px] tabular-nums text-ink-soft/60">
              {personalizationName.length}/{maxLength}
            </span>
          </div>

          {personalizationName.trim() !== '' && !invalid && (
            <p className="mt-3 rounded-lg bg-cream-soft px-3 py-2 text-center">
              <span className="block text-[10.5px] uppercase tracking-wide text-ink-soft/70">
                Preview on bag
              </span>
              <span className="mt-0.5 block break-words font-display text-lg font-extrabold text-ink">
                {personalizationName.trim()}
              </span>
            </p>
          )}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-ink-soft/70">
          {campaign.rewardDisclaimer}
        </p>
      </div>
    </section>
  )
}
