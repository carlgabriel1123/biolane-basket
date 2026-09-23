'use client'

import { useRef, useState } from 'react'
import { babyStages, campaign, type BabyStage } from '@/data/campaign'
import { track } from '@/lib/analytics'
import { addDays, isPlausibleEmail, manilaToday, normalisePhMobile, tidy } from '@/lib/validate'

export interface CommunityValues {
  name: string
  email: string
  mobile: string
  babyStage: BabyStage | ''
  dueDate: string
  consent: boolean
}

interface Props {
  values: CommunityValues
  onChange: (next: CommunityValues) => void
  onSubmit: () => void
  submitting: boolean
}

type Errors = Partial<Record<keyof CommunityValues, string>>

const inputBase =
  'mt-1.5 min-h-[50px] w-full rounded-xl border-2 bg-white px-4 text-[16px] text-ink placeholder:text-ink-soft/45 focus:outline-none'

export default function CommunityForm({ values, onChange, onSubmit, submitting }: Props) {
  const [errors, setErrors] = useState<Errors>({})
  const started = useRef(false)

  const today = manilaToday()
  const maxDue = addDays(today, 300)

  const set = <K extends keyof CommunityValues>(key: K, value: CommunityValues[K]) => {
    if (!started.current) {
      started.current = true
      track('community_signup_started')
    }
    // Switching away from "Expecting" clears the due date in the SAME update,
    // so an orphaned date can never reach the payload.
    if (key === 'babyStage' && value !== 'expecting') {
      onChange({ ...values, babyStage: value as BabyStage, dueDate: '' })
      setErrors((e) => ({ ...e, babyStage: undefined, dueDate: undefined }))
      return
    }
    onChange({ ...values, [key]: value })
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validate = (): boolean => {
    const next: Errors = {}

    if (tidy(values.name).length < 2) next.name = 'Please enter your name.'

    if (!isPlausibleEmail(values.email)) next.email = 'Please check your email address.'

    if (!normalisePhMobile(values.mobile))
      next.mobile = 'Please enter a mobile number like 0917 123 4567.'

    if (!values.babyStage) next.babyStage = 'Please choose one.'

    if (values.babyStage === 'expecting' && values.dueDate) {
      if (values.dueDate < today) next.dueDate = 'Due date cannot be in the past.'
      else if (values.dueDate > maxDue) next.dueDate = 'Please check the year.'
    }

    setErrors(next)

    // Work out the first problem from `next`, not the DOM: React hasn't
    // re-rendered the error states yet at this point.
    const order: Array<keyof CommunityValues> = ['name', 'email', 'mobile', 'babyStage', 'dueDate']
    const firstKey = order.find((k) => next[k])
    if (firstKey) {
      const el =
        firstKey === 'babyStage'
          ? document.querySelector<HTMLElement>('input[name="babyStage"]')
          : document.getElementById(firstKey)
      el?.focus({ preventScroll: true })
      ;(el?.closest('label, div') ?? el)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return false
    }
    return true
  }

  /** The keyboard's "Next" key moves to the next field instead of submitting. */
  const nextOnEnter = (nextId: string) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const el =
      nextId === 'babyStage'
        ? document.querySelector<HTMLElement>('input[name="babyStage"]:checked') ??
          document.querySelector<HTMLElement>('input[name="babyStage"]')
        : document.getElementById(nextId)
    el?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (validate()) onSubmit()
  }

  const err = (key: keyof CommunityValues) =>
    errors[key] ? (
      <p id={key + '-error'} role="alert" className="mt-1 text-[12.5px] font-medium text-[#c0392b]">
        {errors[key]}
      </p>
    ) : null

  const borderFor = (key: keyof CommunityValues) =>
    errors[key] ? 'border-[#c0392b]' : 'border-ink/15 focus:border-blue'

  return (
    <section
      aria-labelledby="community-heading"
      className="rounded-card border border-ink/10 bg-white p-5 shadow-soft md:p-7"
    >
      {/* This form is the first screen, so its heading is the page's h1. */}
      <h1
        id="community-heading"
        tabIndex={-1}
        className="font-display text-[21px] font-extrabold leading-snug text-ink outline-none md:text-2xl"
      >
        {campaign.communityHeading} <span aria-hidden="true">💛</span>
      </h1>

      <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="text-[13.5px] font-semibold text-ink">
            Mommy&rsquo;s name
          </label>
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            autoComplete="name"
            enterKeyHint="next"
            onKeyDown={nextOnEnter('email')}
            data-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            aria-invalid={Boolean(errors.name)}
            placeholder="Your name"
            className={inputBase + ' ' + borderFor('name')}
          />
          {err('name')}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="text-[13.5px] font-semibold text-ink">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            autoComplete="email"
            inputMode="email"
            enterKeyHint="next"
            onKeyDown={nextOnEnter('mobile')}
            data-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            placeholder="you@email.com"
            className={inputBase + ' ' + borderFor('email')}
          />
          {err('email')}
        </div>

        {/* Mobile */}
        <div>
          <label htmlFor="mobile" className="text-[13.5px] font-semibold text-ink">
            Mobile number
          </label>
          <input
            id="mobile"
            /* type="tel", never "number" — number strips the leading 0 of 09xx. */
            type="tel"
            value={values.mobile}
            onChange={(e) => set('mobile', e.target.value)}
            autoComplete="tel"
            inputMode="numeric"
            enterKeyHint="next"
            onKeyDown={nextOnEnter('babyStage')}
            data-invalid={Boolean(errors.mobile)}
            aria-describedby={errors.mobile ? 'mobile-error' : 'mobile-help'}
            aria-invalid={Boolean(errors.mobile)}
            placeholder="0917 123 4567"
            className={inputBase + ' ' + borderFor('mobile')}
          />
          {errors.mobile ? (
            err('mobile')
          ) : (
            <p id="mobile-help" className="mt-1 text-[11.5px] text-ink-soft/70">
              Philippine mobile number.
            </p>
          )}
        </div>

        {/* Baby stage */}
        <fieldset data-invalid={Boolean(errors.babyStage)}>
          <legend className="text-[13.5px] font-semibold text-ink">Baby stage</legend>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {babyStages.map((stage) => {
              const active = values.babyStage === stage.value
              return (
                <label
                  key={stage.value}
                  className={
                    'flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border-2 px-4 transition-colors has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-blue ' +
                    (active ? 'border-blue bg-sky-soft' : 'border-ink/15 bg-white')
                  }
                >
                  <input
                    type="radio"
                    name="babyStage"
                    value={stage.value}
                    checked={active}
                    onChange={() => set('babyStage', stage.value)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={
                      'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ' +
                      (active ? 'border-blue' : 'border-ink/30')
                    }
                  >
                    <span
                      className={
                        'h-2.5 w-2.5 rounded-full bg-blue transition-opacity ' +
                        (active ? 'opacity-100' : 'opacity-0')
                      }
                    />
                  </span>
                  <span className="text-[14px] text-ink">{stage.label}</span>
                </label>
              )
            })}
          </div>
          {err('babyStage')}
        </fieldset>

        {/* Due date — only shown for Expecting */}
        {values.babyStage === 'expecting' && (
          <div className="animate-rise">
            <label htmlFor="dueDate" className="text-[13.5px] font-semibold text-ink">
              Due date <span className="font-normal text-ink-soft/70">(optional)</span>
            </label>
            <input
              id="dueDate"
              type="date"
              value={values.dueDate}
              onChange={(e) => set('dueDate', e.target.value)}
              min={today}
              max={maxDue}
              data-invalid={Boolean(errors.dueDate)}
              aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
              aria-invalid={Boolean(errors.dueDate)}
              className={inputBase + ' ' + borderFor('dueDate')}
            />
            {err('dueDate')}
          </div>
        )}

        {/* Marketing consent — never pre-checked, never blocks submit. */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sky-soft p-3.5 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-blue">
          <input
            type="checkbox"
            checked={values.consent}
            onChange={(e) => set('consent', e.target.checked)}
            className="sr-only"
          />
          <span className="grid h-6 w-6 shrink-0 place-items-center pt-px">
            <span
              aria-hidden="true"
              className={
                'grid h-5 w-5 place-items-center rounded border-2 transition-colors ' +
                (values.consent ? 'border-blue bg-blue' : 'border-ink/30 bg-white')
              }
            >
              <svg
                viewBox="0 0 16 16"
                className={'h-3.5 w-3.5 text-white ' + (values.consent ? 'opacity-100' : 'opacity-0')}
                fill="none"
              >
                <path
                  d="M3.5 8.4l3 3 6-6.4"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
          <span className="text-[12.5px] leading-relaxed text-ink-soft">
            {campaign.consentLabel}
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="min-h-[54px] w-full rounded-full bg-blue px-6 text-[15px] font-bold text-white shadow-lift transition-colors hover:bg-blue-deep disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? 'Opening your checklist…' : campaign.joinCtaLabel}
        </button>

        {/* Policy links open in a new tab so she never loses a half-filled form. */}
        <p className="text-center text-[11px] leading-relaxed text-ink-soft/70">
          By joining you agree to our{' '}
          {campaign.termsUrl && (
            <>
              <a
                href={campaign.termsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Terms &amp; Conditions
              </a>{' '}
              and{' '}
            </>
          )}
          <a
            href={campaign.privacyPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Privacy Policy
          </a>
          .
        </p>
      </form>
    </section>
  )
}
