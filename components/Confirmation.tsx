'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { campaign } from '@/data/campaign'
import { asset } from '@/lib/asset'
import { peso } from '@/lib/format'
import type { Submission } from '@/lib/submission'
import { BagIcon, CheckCircleIcon, CheckIcon, ClockIcon, GiftIcon, HeartIcon, StoreIcon } from './icons'
import { Badge, Button, Card } from './ui'

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
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Dads and grandparents sign up too, so thank them by name.
  const first = submission.name.trim().split(/\s+/)[0] ?? ''
  const firstName = first ? first.charAt(0).toLocaleUpperCase('en-PH') + first.slice(1) : ''

  const stamp = new Date(submission.timestamp).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-16 pt-16 md:max-w-lg md:pt-20">
      <div className="text-center">
        <Image
          src={asset('/images/brand/biolane-logo.png')}
          alt="Biolane"
          width={110}
          height={32}
          priority
          className="mx-auto h-auto w-[104px]"
        />

        <div
          aria-hidden="true"
          className="animate-pop mx-auto mt-6 grid h-20 w-20 place-items-center rounded-full bg-success/10 text-success"
        >
          <CheckCircleIcon size={44} />
        </div>

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 font-display text-[26px] font-extrabold leading-tight text-ink outline-none"
        >
          {firstName ? <>Thank you, {firstName}!</> : <>Thank you!</>}
        </h1>

        <p className="mt-1.5 text-[14px] text-ink-soft">
          Your Biolane Nesting Checklist is ready.
        </p>
      </div>

      {/* Claim code — the thing staff actually read. Styled as a ticket. */}
      <div className="relative mt-6 rounded-card border-2 border-dashed border-ink/15 bg-white p-5 text-center">
        <span aria-hidden="true" className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-sky-soft" />
        <span aria-hidden="true" className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-sky-soft" />

        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft/70">
          Claim code
        </p>
        <p className="mt-1 font-display text-[30px] font-extrabold tracking-wider tabular-nums text-ink">
          {submission.submissionId}
        </p>
        <p className="mt-1 text-[11.5px] text-ink-soft/70">{stamp}</p>

        <p className="mt-3">
          {storedRemotely ? (
            <Badge tone="success" icon={<CheckIcon size={13} strokeWidth={3} />}>
              Saved
            </Badge>
          ) : (
            <Badge tone="gold" icon={<ClockIcon size={13} />}>
              Will sync — still valid
            </Badge>
          )}
        </p>
      </div>

      {/* Reward */}
      {submission.rewardUnlocked && (
        <div className="animate-rise mt-4 rounded-card border border-gold/35 bg-cream p-5 text-center">
          <span
            aria-hidden="true"
            className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-gold shadow-soft"
          >
            <GiftIcon size={24} />
          </span>
          <p className="mt-3 font-display text-[15px] font-extrabold uppercase tracking-wide text-gold">
            {campaign.rewardShortName} unlocked
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
      <section aria-labelledby="summary-heading" className="mt-4">
        <Card className="p-5">
          <h2 id="summary-heading" className="flex items-center gap-2.5 font-display text-[15px] font-extrabold text-ink">
            <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-soft text-blue">
              <BagIcon size={16} />
            </span>
            Your nesting basket
          </h2>

          <ul className="mt-3 flex flex-col divide-y divide-ink/10">
            {submission.selectedProducts.map((p) => (
              <li key={p.id} className="flex items-baseline justify-between gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold leading-snug text-ink">
                    {p.name} <span className="font-display font-extrabold tabular-nums text-blue">× {p.qty}</span>
                  </span>
                  <span className="text-[11.5px] text-ink-soft/70">
                    {p.size ? `${p.size} · ` : ''}SKU {p.gbfSku}
                    {p.qty > 1 ? ` · ${peso(p.price)} each` : ''}
                  </span>
                </span>
                <span className="shrink-0 text-[14px] font-semibold tabular-nums text-ink">
                  {peso(p.lineTotal)}
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
        </Card>
      </section>

      {/* Community */}
      <div className="mt-4 rounded-card bg-sky-soft p-4 text-center">
        <p className="flex items-center justify-center gap-1.5 text-[13.5px] font-semibold text-ink">
          You&rsquo;re in the Biolane Community <HeartIcon size={16} className="shrink-0 text-gold" />
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
        <span aria-hidden="true" className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-sky-soft text-blue">
          <StoreIcon size={20} />
        </span>
        <p className="mt-2 font-display text-[15px] font-bold text-ink">
          Please show this screen to our Biolane team at the booth.
        </p>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-soft/70">
        {campaign.confirmationDisclaimer}
        <br />
        No purchase was made on this page.
      </p>

      <Button variant="secondary" full onClick={onStartOver} className="mt-8">
        Start over for the next guest
      </Button>
    </main>
  )
}
