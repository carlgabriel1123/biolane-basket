'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { campaign } from '@/data/campaign'
import { peso } from '@/lib/format'
import type { Submission } from '@/lib/submission'

interface Props {
  /** Immutable snapshot taken at submit time. Never recomputed. */
  submission: Submission
  storedRemotely: boolean
  onStartOver: () => void
}

export default function Confirmation({ submission, storedRemotely, onStartOver }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const stamp = new Date(submission.timestamp).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-16 pt-8">
      <div className="text-center">
        <Image
          src="/images/brand/biolane-logo.png"
          alt="Biolane"
          width={110}
          height={32}
          priority
          className="mx-auto h-auto w-[104px]"
        />

        <p className="mt-6 text-3xl" aria-hidden="true">
          💛
        </p>

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 font-display text-[26px] font-extrabold leading-tight text-ink outline-none"
        >
          Thank you, Mommy!
        </h1>

        <p className="mt-1.5 text-[14px] text-ink-soft">
          Your Biolane Nesting Checklist is ready.
        </p>
      </div>

      {/* Claim code — the thing staff actually read. */}
      <div className="mt-6 rounded-card border-2 border-ink/10 bg-white p-5 text-center shadow-soft">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft/70">
          Claim code
        </p>
        <p className="mt-1 font-display text-[30px] font-extrabold tracking-wide text-ink">
          {submission.submissionId}
        </p>
        <p className="mt-1 text-[11.5px] text-ink-soft/70">{stamp}</p>

        <p
          className={
            'mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ' +
            (storedRemotely
              ? 'bg-mint text-[#1d6b5f]'
              : 'bg-cream text-gold')
          }
        >
          <span aria-hidden="true">{storedRemotely ? '✓' : '⟳'}</span>
          {storedRemotely ? 'Saved' : 'Will sync — still valid'}
        </p>
      </div>

      {/* Reward */}
      {submission.rewardUnlocked && (
        <div className="animate-rise mt-4 rounded-card border border-gold/35 bg-cream p-5 text-center">
          <p className="font-display text-[15px] font-extrabold uppercase tracking-wide text-gold">
            <span aria-hidden="true">🎁</span> {campaign.rewardShortName} unlocked
          </p>
          {submission.personalizationName && (
            <>
              <p className="mt-3 text-[11px] uppercase tracking-wide text-ink-soft/70">
                To be personalized with
              </p>
              <p className="mt-0.5 break-words font-display text-2xl font-extrabold text-ink">
                {submission.personalizationName}
              </p>
            </>
          )}
        </div>
      )}

      {/* Basket */}
      <section
        aria-labelledby="summary-heading"
        className="mt-4 rounded-card border border-ink/10 bg-white p-5 shadow-soft"
      >
        <h2 id="summary-heading" className="font-display text-[15px] font-extrabold text-ink">
          Your nesting basket
        </h2>

        <ul className="mt-3 flex flex-col divide-y divide-ink/10">
          {submission.selectedProducts.map((p) => (
            <li key={p.id} className="flex items-baseline justify-between gap-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold leading-snug text-ink">
                  {p.name}
                </span>
                <span className="text-[11.5px] text-ink-soft/70">
                  {p.size} · SKU {p.gbfSku}
                </span>
              </span>
              <span className="shrink-0 text-[14px] font-semibold tabular-nums text-ink">
                {peso(p.price)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-baseline justify-between border-t-2 border-ink/10 pt-3">
          <span className="font-display text-[15px] font-extrabold text-ink">Total</span>
          <span className="font-display text-[22px] font-extrabold tabular-nums text-blue">
            {peso(submission.basketTotal)}
          </span>
        </div>
      </section>

      {/* Community */}
      <div className="mt-4 rounded-card bg-sky-soft p-4 text-center">
        <p className="text-[13.5px] font-semibold text-ink">
          You&rsquo;re in the Biolane Mom Community <span aria-hidden="true">💛</span>
        </p>
        <p className="mt-1 text-[12px] text-ink-soft">
          We&rsquo;ll reach {submission.name} at {submission.mobile}.
        </p>
        {!submission.marketingConsent && (
          <p className="mt-1.5 text-[11px] text-ink-soft/70">
            You opted out of marketing emails — we&rsquo;ll only contact you about your reward.
          </p>
        )}
      </div>

      {/* Booth instruction */}
      <div className="mt-6 rounded-card border-2 border-dashed border-blue/40 bg-white p-4 text-center">
        <p className="font-display text-[15px] font-bold text-ink">
          Please show this screen to our Biolane team at the booth.
        </p>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-soft/70">
        {campaign.confirmationDisclaimer}
        <br />
        No purchase was made on this page.
      </p>

      <button
        type="button"
        onClick={onStartOver}
        className="mt-8 min-h-[48px] w-full rounded-full border-2 border-ink/15 bg-white px-6 text-[14px] font-bold text-ink-soft transition-colors hover:border-blue hover:text-blue"
      >
        Start over for the next mom
      </button>
    </main>
  )
}
