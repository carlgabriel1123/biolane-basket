'use client'

import Image from 'next/image'
import { campaign } from '@/data/campaign'

export default function Hero({ onStart }: { onStart: () => void }) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-white via-sky-soft to-sky-soft px-5 pb-8 pt-7 text-center">
      {/* Soft decorative wash — purely ornamental. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sky/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-24 h-52 w-52 rounded-full bg-blush/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-md">
        <Image
          src="/images/brand/biolane-logo.png"
          alt="Biolane"
          width={132}
          height={38}
          priority
          className="mx-auto h-auto w-[124px]"
        />

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue">
          {campaign.eyebrow}
        </p>

        <h1 className="mt-2 font-display text-[30px] font-extrabold leading-[1.12] text-ink sm:text-4xl">
          {campaign.headline}
        </h1>

        <p className="mt-2 font-display text-lg font-bold text-blue">
          {campaign.subheadline} <span aria-hidden="true">💛</span>
        </p>

        <p className="mx-auto mt-3 max-w-[22rem] text-[14px] leading-relaxed text-ink-soft">
          {campaign.supportingText}
        </p>

        {/* Reward teaser */}
        <div className="mt-6 rounded-card border border-gold/25 bg-cream-soft px-5 py-4 shadow-soft">
          <p className="font-display text-xl font-extrabold text-ink">
            <span aria-hidden="true">🎁</span> {campaign.rewardTeaserAmount}
          </p>
          <p className="mt-1 text-[13px] font-medium uppercase tracking-wide text-gold">
            {campaign.rewardTeaserPrize}
          </p>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="mt-6 min-h-[54px] w-full rounded-full bg-blue px-6 text-[15px] font-bold text-white shadow-lift transition-colors hover:bg-blue-deep active:bg-blue-deep"
        >
          {campaign.ctaLabel}
        </button>

        <p className="mt-3 text-[11px] leading-relaxed text-ink-soft/70">
          {campaign.rewardDisclaimer}
        </p>
      </div>
    </header>
  )
}
