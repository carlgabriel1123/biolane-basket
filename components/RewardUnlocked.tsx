'use client'

import { bagColors, campaign, type BagColor } from '@/data/campaign'
import { BAG_NAME_MAX_LETTERS, cleanBagName, isPrintableBagName } from '@/lib/validate'
import { AlertIcon, GiftIcon, PartyIcon } from './icons'
import { ChoiceChip, STAGE_TONES } from './ui'

interface Props {
  personalizationName: string
  onChangeName: (value: string) => void
  /** Gift bag colour, '' until she chooses. */
  bagColor: BagColor | ''
  onChangeColor: (color: BagColor) => void
  /** She tried to finish without choosing a colour. */
  colorMissing: boolean
}

const SWATCH: Record<BagColor, string> = { blue: 'bg-bag-blue', pink: 'bg-bag-pink' }
const PREVIEW: Record<BagColor, string> = { blue: 'bg-bag-blue/25', pink: 'bg-bag-pink/25' }

export default function RewardUnlocked({
  personalizationName,
  onChangeName,
  bagColor,
  onChangeColor,
  colorMissing,
}: Props) {
  // No focus move on unlock: she is usually mid-tap on a + button, and
  // jumping the page would lose her place. The basket bar's live region
  // announces "Gift unlocked" instead.
  const name = cleanBagName(personalizationName)
  const invalid = name !== '' && !isPrintableBagName(name)
  const tooLong = [...name].length > BAG_NAME_MAX_LETTERS
  const showColorError = colorMissing && !bagColor

  return (
    <section
      aria-labelledby="reward-unlocked-heading"
      className="animate-unfold relative overflow-hidden rounded-card border border-gold/35 bg-cream p-5 text-center shadow-lift"
    >
      <div
        aria-hidden="true"
        className="reward-sheen pointer-events-none absolute inset-0"
      />

      <div className="relative">
        <span
          aria-hidden="true"
          className="animate-pop mx-auto grid h-14 w-14 place-items-center rounded-pill bg-gold text-white shadow-soft"
        >
          <PartyIcon size={28} />
        </span>

        <h2
          id="reward-unlocked-heading"
          className="mt-3 font-display text-2xl font-extrabold text-ink"
        >
          You did it!
        </h2>

        <p className="mt-1.5 text-[14px] text-ink-soft">
          Your Biolane reward is unlocked.
        </p>

        <p className="mt-4 flex items-center justify-center gap-1.5 font-display text-[15px] font-extrabold uppercase tracking-wide text-gold-ink">
          <GiftIcon size={18} /> Free {campaign.rewardName}
        </p>

        {/* Bag colour: required before she can finish. */}
        <div id="bag-color-group" className="mt-5 scroll-mt-24 rounded-2xl bg-white/80 p-4 text-left">
          <fieldset aria-describedby={showColorError ? 'bag-color-error' : undefined}>
            <legend className="font-display text-[14px] font-bold text-ink">Choose your bag color</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {bagColors.map((c) => (
                <ChoiceChip
                  key={c.value}
                  compact
                  name="bag-color"
                  value={c.value}
                  checked={bagColor === c.value}
                  onChange={() => onChangeColor(c.value)}
                  label={c.label}
                  icon={
                    <span
                      key={bagColor === c.value ? 'chosen' : 'not-chosen'}
                      className={`block h-5 w-5 rounded-full ring-2 ring-white ${SWATCH[c.value]} ${bagColor === c.value ? 'animate-flip' : ''}`}
                    />
                  }
                  tone={c.value === 'pink' ? STAGE_TONES.expecting : STAGE_TONES.baby}
                />
              ))}
            </div>
            {showColorError && (
              <p
                id="bag-color-error"
                role="alert"
                className="mt-1.5 flex items-start gap-1.5 text-[12.5px] font-semibold text-danger"
              >
                <AlertIcon size={16} className="mt-px shrink-0" />
                <span>Please choose Blue or Pink for your bag.</span>
              </p>
            )}
          </fieldset>
        </div>

        <div className="mt-3 rounded-2xl bg-white/80 p-4 text-left">
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
            maxLength={BAG_NAME_MAX_LETTERS}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="e.g. Ana"
            aria-describedby="personalization-help"
            aria-invalid={invalid || undefined}
            /* 16px minimum stops iOS Safari auto-zooming on focus. */
            className={`mt-2 min-h-[50px] w-full rounded-2xl border-2 bg-white px-4 text-[16px] font-semibold text-ink placeholder:font-normal placeholder:text-ink-soft/45 focus:outline-none ${
              invalid ? 'border-danger focus:border-danger' : 'border-ink/15 focus:border-blue'
            }`}
          />

          <div className="mt-1.5 flex items-start justify-between gap-3">
            <p
              id="personalization-help"
              role={invalid ? 'alert' : undefined}
              className={`text-[11.5px] ${invalid ? 'font-semibold text-danger' : 'text-ink-soft/90'}`}
            >
              {invalid
                ? tooLong
                  ? `Up to ${BAG_NAME_MAX_LETTERS} letters only.`
                  : 'Letters only: no spaces, numbers or symbols.'
                : `Up to ${BAG_NAME_MAX_LETTERS} letters.`}
            </p>
            <span className="shrink-0 text-[11.5px] tabular-nums text-ink-soft/85">
              {[...name].length}/{BAG_NAME_MAX_LETTERS}
            </span>
          </div>

          {name !== '' && !invalid && (
            <p className={`mt-3 rounded-xl px-3 py-2 text-center ${bagColor ? PREVIEW[bagColor] : 'bg-cream-soft'}`}>
              <span className="block text-[10.5px] uppercase tracking-wide text-ink-soft/90">
                Preview on bag
              </span>
              <span className="mt-0.5 block break-words font-display text-lg font-extrabold text-ink">
                {name}
              </span>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
