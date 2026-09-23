'use client'

import { useRef, useState, type ReactNode } from 'react'
import { babyStages, campaign, relationships, type BabyStage, type Relationship } from '@/data/campaign'
import { track } from '@/lib/analytics'
import { addDays, isPlausibleEmail, manilaToday, normalisePhMobile, tidy } from '@/lib/validate'
import {
  AlertIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  HeartIcon,
  MailIcon,
  PhoneIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
} from './icons'
import { Button, Card, ChoiceChip, STAGE_TONES, stageTone } from './ui'

export interface CommunityValues {
  name: string
  /** "Are you…" — Dad, Mom, Grandparent, or Others. */
  relationship: Relationship | ''
  /** Filled in only when relationship is 'others'. */
  relationshipOther: string
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

/** The icon on each "Are you…" chip. */
const RELATIONSHIP_ICONS: Record<Relationship, typeof UserIcon> = {
  dad: UserIcon,
  mom: HeartIcon,
  grandparent: UsersIcon,
  others: SparklesIcon,
}

/** One line under each stage chip's label. */
const STAGE_HINTS: Record<BabyStage, string> = {
  expecting: 'Getting ready for baby',
  baby: 'Newborn to first birthday',
  toddler: 'Walking, talking, exploring',
  others: 'Just browsing',
}

/** Fields are validated in this order, and the first problem gets focus. */
const FIELD_ORDER: Array<keyof CommunityValues> = [
  'name',
  'relationship',
  'relationshipOther',
  'email',
  'mobile',
  'babyStage',
  'dueDate',
]

const inputBase =
  'min-h-[52px] w-full rounded-2xl border-2 bg-white pl-12 pr-4 text-[16px] text-ink placeholder:text-ink-soft/45 transition-colors focus:outline-none focus:shadow-glow'

const labelClass = 'text-[13.5px] font-semibold text-ink'

/** An input with a decorative leading icon; the icon follows focus and error state. */
function Field({ icon, invalid, children }: { icon: ReactNode; invalid: boolean; children: ReactNode }) {
  return (
    <div className="group relative mt-1.5">
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
          invalid ? 'text-danger' : 'text-ink-soft/55 group-focus-within:text-blue'
        }`}
      >
        {icon}
      </span>
      {children}
    </div>
  )
}

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
    // Switching away from Others clears its text in the same update.
    if (key === 'relationship' && value !== 'others') {
      onChange({ ...values, relationship: value as Relationship, relationshipOther: '' })
      setErrors((e) => ({ ...e, relationship: undefined, relationshipOther: undefined }))
      return
    }
    if (key === 'babyStage' && value !== 'expecting') {
      onChange({ ...values, babyStage: value as BabyStage, dueDate: '' })
      setErrors((e) => ({ ...e, babyStage: undefined, dueDate: undefined }))
      return
    }
    onChange({ ...values, [key]: value })
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  /** The rule for ONE field — shared by blur and submit so the messages can never drift apart. */
  const ruleFor = (key: keyof CommunityValues): string | undefined => {
    switch (key) {
      case 'name':
        return tidy(values.name).length < 2 ? 'Please enter your name.' : undefined
      case 'relationship':
        return values.relationship ? undefined : 'Please choose one.'
      case 'relationshipOther':
        return values.relationship === 'others' && tidy(values.relationshipOther).length < 2
          ? 'Please tell us who you are to the baby.'
          : undefined
      case 'email':
        return isPlausibleEmail(values.email) ? undefined : 'Please check your email address.'
      case 'mobile':
        return normalisePhMobile(values.mobile) ? undefined : 'Please enter a mobile number like 0917 123 4567.'
      case 'babyStage':
        return values.babyStage ? undefined : 'Please choose one.'
      case 'dueDate':
        if (values.babyStage === 'expecting' && values.dueDate) {
          if (values.dueDate < today) return 'Due date cannot be in the past.'
          if (values.dueDate > maxDue) return 'Please check the year.'
        }
        return undefined
      default:
        return undefined
    }
  }

  /** Blur: check just this field, leaving every other field's state alone. */
  const validateField = (key: keyof CommunityValues) => {
    const message = ruleFor(key)
    setErrors((e) => (e[key] === message ? e : { ...e, [key]: message }))
  }

  /** Radio groups: only validate when focus leaves the whole group, not while moving between chips. */
  const validateGroupOnBlur = (key: 'relationship' | 'babyStage') => (e: React.FocusEvent<HTMLFieldSetElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    validateField(key)
  }

  const validate = (): boolean => {
    const next: Errors = {}
    for (const key of FIELD_ORDER) {
      const message = ruleFor(key)
      if (message) next[key] = message
    }

    setErrors(next)

    // Work out the first problem from `next`, not the DOM: React hasn't
    // re-rendered the error states yet at this point.
    const firstKey = FIELD_ORDER.find((k) => next[k])
    if (firstKey) {
      const el =
        firstKey === 'babyStage' || firstKey === 'relationship'
          ? document.querySelector<HTMLElement>(`input[name="${firstKey}"]`)
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
    const isRadioGroup = nextId === 'babyStage' || nextId === 'relationship'
    const el = isRadioGroup
      ? document.querySelector<HTMLElement>(`input[name="${nextId}"]:checked`) ??
        document.querySelector<HTMLElement>(`input[name="${nextId}"]`)
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
      <p id={key + '-error'} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[12.5px] font-medium text-danger">
        <AlertIcon size={16} className="mt-px shrink-0" />
        <span>{errors[key]}</span>
      </p>
    ) : null

  const borderFor = (key: keyof CommunityValues) =>
    errors[key] ? 'border-danger' : 'border-ink/10 hover:border-ink/25 focus:border-blue'

  return (
    <section aria-labelledby="community-heading" className="animate-rise">
      <Card className="p-5 md:p-7">
        {/* This form is the first screen, so its heading is the page's h1. */}
        <h1 id="community-heading" tabIndex={-1} className="outline-none">
          <span className="block font-display text-[26px] font-extrabold leading-tight text-ink md:text-3xl">
            {campaign.communityHeading}
          </span>
          <span className="mt-1.5 block text-[15px] font-semibold leading-snug text-ink-soft md:text-base">
            {campaign.communitySubheading}
          </span>
        </h1>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <Field icon={<UserIcon size={20} />} invalid={Boolean(errors.name)}>
              <input
                id="name"
                type="text"
                value={values.name}
                onChange={(e) => set('name', e.target.value)}
                onBlur={() => validateField('name')}
                autoComplete="name"
                enterKeyHint="next"
                onKeyDown={nextOnEnter('relationship')}
                data-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'name-error' : undefined}
                aria-invalid={Boolean(errors.name)}
                placeholder="Your name"
                className={inputBase + ' ' + borderFor('name')}
              />
            </Field>
            {err('name')}
          </div>

          {/* Are you… — right after Name */}
          <fieldset
            data-invalid={Boolean(errors.relationship)}
            aria-describedby={errors.relationship ? 'relationship-error' : undefined}
            onBlur={validateGroupOnBlur('relationship')}
          >
            <legend className={labelClass}>Are you…</legend>
            {/* One column on phones: "Grandparent" plus its icon and check needs the width. */}
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              {relationships.map((option) => {
                const active = values.relationship === option.value
                const Icon = RELATIONSHIP_ICONS[option.value]
                return (
                  <ChoiceChip
                    key={option.value}
                    name="relationship"
                    value={option.value}
                    checked={active}
                    onChange={() => set('relationship', option.value)}
                    label={option.label}
                    icon={<Icon size={18} />}
                    tone={STAGE_TONES.baby}
                  />
                )
              })}
            </div>
            {err('relationship')}
          </fieldset>

          {/* Others — specify */}
          {values.relationship === 'others' && (
            <div className="animate-rise -mt-1">
              <label htmlFor="relationshipOther" className={labelClass}>
                Please specify
              </label>
              <Field icon={<SparklesIcon size={20} />} invalid={Boolean(errors.relationshipOther)}>
                <input
                  id="relationshipOther"
                  type="text"
                  value={values.relationshipOther}
                  onChange={(e) => set('relationshipOther', e.target.value)}
                  onBlur={() => validateField('relationshipOther')}
                  maxLength={40}
                  enterKeyHint="next"
                  onKeyDown={nextOnEnter('email')}
                  data-invalid={Boolean(errors.relationshipOther)}
                  aria-describedby={errors.relationshipOther ? 'relationshipOther-error' : undefined}
                  aria-invalid={Boolean(errors.relationshipOther)}
                  placeholder="Tita, ninang, family friend"
                  className={inputBase + ' ' + borderFor('relationshipOther')}
                />
              </Field>
              {err('relationshipOther')}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className={labelClass}>
              Email address
            </label>
            <Field icon={<MailIcon size={20} />} invalid={Boolean(errors.email)}>
              <input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => set('email', e.target.value)}
                onBlur={() => validateField('email')}
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
            </Field>
            {err('email')}
          </div>

          {/* Mobile */}
          <div>
            <label htmlFor="mobile" className={labelClass}>
              Mobile number
            </label>
            <Field icon={<PhoneIcon size={20} />} invalid={Boolean(errors.mobile)}>
              <input
                id="mobile"
                /* type="tel", never "number" — number strips the leading 0 of 09xx. */
                type="tel"
                value={values.mobile}
                onChange={(e) => set('mobile', e.target.value)}
                onBlur={() => validateField('mobile')}
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
            </Field>
            {errors.mobile ? (
              err('mobile')
            ) : (
              <p id="mobile-help" className="mt-1.5 text-[11.5px] text-ink-soft/70">
                Philippine mobile number.
              </p>
            )}
          </div>

          {/* Baby stage */}
          <fieldset
            data-invalid={Boolean(errors.babyStage)}
            aria-describedby={errors.babyStage ? 'babyStage-error' : undefined}
            onBlur={validateGroupOnBlur('babyStage')}
          >
            <legend className={labelClass}>Baby stage</legend>
            <div className="mt-2 grid grid-cols-1 gap-2">
              {babyStages.map((stage) => {
                const active = values.babyStage === stage.value
                const tone = stageTone(stage.value)
                const Icon = tone.Icon
                return (
                  <ChoiceChip
                    key={stage.value}
                    name="babyStage"
                    value={stage.value}
                    checked={active}
                    onChange={() => set('babyStage', stage.value)}
                    label={stage.label}
                    hint={STAGE_HINTS[stage.value]}
                    icon={<Icon size={18} />}
                    tone={tone}
                  />
                )
              })}
            </div>
            {err('babyStage')}
          </fieldset>

          {/* Due date — only shown for Expecting */}
          {values.babyStage === 'expecting' && (
            <div className="animate-rise">
              <label htmlFor="dueDate" className={labelClass}>
                Due date <span className="font-normal text-ink-soft/70">(optional)</span>
              </label>
              <Field icon={<CalendarIcon size={20} />} invalid={Boolean(errors.dueDate)}>
                <input
                  id="dueDate"
                  type="date"
                  value={values.dueDate}
                  onChange={(e) => set('dueDate', e.target.value)}
                  onBlur={() => validateField('dueDate')}
                  min={today}
                  max={maxDue}
                  data-invalid={Boolean(errors.dueDate)}
                  aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
                  aria-invalid={Boolean(errors.dueDate)}
                  className={inputBase + ' ' + borderFor('dueDate')}
                />
              </Field>
              {err('dueDate')}
            </div>
          )}

          {/* Marketing consent — never pre-checked, never blocks submit. */}
          <label className="press flex min-h-[52px] cursor-pointer items-start gap-3 rounded-2xl bg-sky-soft p-4 has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-blue">
            <input
              type="checkbox"
              checked={values.consent}
              onChange={(e) => set('consent', e.target.checked)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={
                'mt-px grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition-colors ' +
                (values.consent ? 'border-blue bg-blue text-white' : 'border-ink/25 bg-white text-transparent')
              }
            >
              <CheckIcon size={14} strokeWidth={3} />
            </span>
            <span className="text-[12.5px] leading-relaxed text-ink-soft">{campaign.consentLabel}</span>
          </label>

          <Button
            type="submit"
            size="lg"
            full
            loading={submitting}
            disabled={submitting}
            iconRight={<ArrowRightIcon size={20} />}
            className="mt-1"
          >
            {submitting ? 'Opening your checklist…' : campaign.joinCtaLabel}
          </Button>

          {/* Policy links open in a new tab so she never loses a half-filled form. */}
          <p className="text-center text-[11px] leading-relaxed text-ink-soft/70">
            By joining you agree to our{' '}
            {campaign.termsUrl && (
              <>
                <a href={campaign.termsUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Terms &amp; Conditions
                </a>{' '}
                and{' '}
              </>
            )}
            <a href={campaign.privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="underline">
              Privacy Policy
            </a>
            .
          </p>
        </form>
      </Card>
    </section>
  )
}
