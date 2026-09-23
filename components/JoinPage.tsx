'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import { campaign } from '@/data/campaign'
import { asset } from '@/lib/asset'
import CommunityForm, { type CommunityValues } from './CommunityForm'
import { InfoIcon } from './icons'
import { StepIndicator } from './ui'

interface Props {
  values: CommunityValues
  onChange: (next: CommunityValues) => void
  onSubmit: () => void
  submitting: boolean
  /** True when she came back via "Change" — adjusts the intro line. */
  returning: boolean
}

/** Screen 1: logo, the reward, and the Biolane Mom Community sign-up. */
export default function JoinPage({ values, onChange, onSubmit, submitting, returning }: Props) {
  // Coming back via Change or Back: the control she used is gone, so land
  // keyboard and screen-reader focus on the heading instead of <body>.
  useEffect(() => {
    if (returning) document.getElementById('community-heading')?.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="relative overflow-hidden px-4 pb-16 pt-7 md:pt-12">
      {/* Two pastel blobs drift slowly behind the card; out of phase so they never move in lockstep. */}
      <div
        aria-hidden="true"
        className="animate-drift pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sky/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-drift pointer-events-none absolute -right-20 top-40 h-52 w-52 rounded-full bg-blush/40 blur-3xl"
        style={{ animationDelay: '-4.5s' }}
      />

      <div className="relative mx-auto max-w-md md:max-w-xl">
        <Image
          src={asset('/images/brand/biolane-logo.png')}
          alt="Biolane"
          width={547}
          height={159}
          priority
          className="mx-auto h-auto w-[160px] md:w-[190px]"
        />

        <StepIndicator step={1} total={2} label="About you" className="mt-4 justify-center" />

        {/* The ₱2,299 reward is introduced on the checklist, after she joins. */}
        {returning && (
          <p className="mt-4 flex items-start gap-2.5 rounded-2xl bg-sky-soft px-4 py-3 text-[13px] leading-snug text-ink-soft">
            <InfoIcon size={18} className="mt-px shrink-0 text-blue" />
            <span>Update your details or baby stage, then continue. Your basket is saved.</span>
          </p>
        )}

        <div className="mt-5">
          <CommunityForm values={values} onChange={onChange} onSubmit={onSubmit} submitting={submitting} />
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-ink-soft/70">
          {campaign.promoDates}
          <br />
          {campaign.rewardDisclaimer}
        </p>
      </div>
    </main>
  )
}
