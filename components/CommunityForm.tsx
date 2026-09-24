'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { babyStages, campaign, relationships, type BabyStage, type Relationship } from '@/data/campaign'
import { track } from '@/lib/analytics'
import type { LeadInfo } from '@/lib/submission'
import { addDays, isPlausibleEmail, manilaToday, normaliseHandle, normalisePhMobile, tidy } from '@/lib/validate'
import {
  AlertIcon,
  ArrowRightIcon,
  AtSignIcon,
  BanIcon,
  CalendarIcon,
  CheckIcon,
  HeartIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  SparklesIcon,
  TikTokIcon,
  UserIcon,
  UsersIcon,
} from './icons'
import { Button, Card, ChoiceChip, STAGE_TONES, stageTone } from './ui'

/** TikTok / Instagram question: one app or both, or N/A. */
export type Social = 'tiktok' | 'instagram' | 'none'
const SOCIAL_APPS = ['tiktok', 'instagram'] as const
type SocialApp = (typeof SOCIAL_APPS)[number]

export interface CommunityValues {
  firstName: string
  /** Surname (family name). */
  lastName: string
  /** "Are you…" — Dad, Mom, Grandparent, or Others. */
  relationship: Relationship | ''
  /** Filled in only when relationship is 'others'. */
  relationshipOther: string
  email: string
  mobile: string
  /** Ticked answers: 'tiktok' and/or 'instagram', or just 'none' (N/A). */
  socials: Social[]
  /** Usernames as typed; each is kept only while its app is ticked. */
  tiktok: string
  instagram: string
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

const SOCIAL_OPTIONS: Array<{ value: Social; label: string; hint?: string; Icon: typeof UserIcon }> = [
  { value: 'tiktok', label: 'TikTok', Icon: TikTokIcon },
  { value: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { value: 'none', label: 'N/A', hint: 'I don’t have TikTok or Instagram', Icon: BanIcon },
]

const APP_NAME: Record<SocialApp, string> = { tiktok: 'TikTok', instagram: 'Instagram' }

/** The TikTok / Instagram part of the saved record: usernames only for the apps she ticked. */
export function socialsFor(
  v: Pick<CommunityValues, 'socials' | 'tiktok' | 'instagram'>
): Pick<LeadInfo, 'tiktok' | 'instagram' | 'noSocials'> {
  const tiktok = v.socials.includes('tiktok') ? normaliseHandle(v.tiktok) : null
  const instagram = v.socials.includes('instagram') ? normaliseHandle(v.instagram) : null
  return {
    ...(tiktok ? { tiktok } : {}),
    ...(instagram ? { instagram } : {}),
    ...(v.socials.includes('none') ? { noSocials: true } : {}),
  }
}

/** Groups of chips: focus goes to their first input, not an element with the key as id. */
const GROUPS = new Set<keyof CommunityValues>(['relationship', 'socials', 'babyStage'])

/** One line under each stage chip's label. */
const STAGE_HINTS: Record<BabyStage, string> = {
  expecting: 'Getting ready for baby',
  baby: 'Newborn to first birthday',
  toddler: 'Walking, talking, exploring',
  others: 'Just browsing',
}

/** Fields are validated in this order, and the first problem gets focus. */
const FIELD_ORDER: Array<keyof CommunityValues> = [
  'firstName',
  'lastName',
  'relationship',
  'relationshipOther',
  'email',
  'mobile',
  'socials',
  'tiktok',
  'instagram',
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
          invalid ? 'text-danger' : 'text-ink-soft/80 group-focus-within:text-blue'
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
    if (key === 'socials') {
      // Unticking an app clears its username in the same update.
      const next = value as Social[]
      onChange({
        ...values,
        socials: next,
        tiktok: next.includes('tiktok') ? values.tiktok : '',
        instagram: next.includes('instagram') ? values.instagram : '',
      })
      setErrors((e) => ({
        ...e,
        socials: undefined,
        tiktok: next.includes('tiktok') ? e.tiktok : undefined,
        instagram: next.includes('instagram') ? e.instagram : undefined,
      }))
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

  /** N/A clears both apps; ticking an app clears N/A. */
  const toggleSocial = (option: Social) => {
    const ticked = values.socials.includes(option)
    const next: Social[] =
      option === 'none'
        ? ticked
          ? []
          : ['none']
        : SOCIAL_APPS.filter((app) => (app === option ? !ticked : values.socials.includes(app)))
    set('socials', next)
  }

  /** The rule for ONE field — shared by blur and submit so the messages can never drift apart. */
  const ruleFor = (key: keyof CommunityValues): string | undefined => {
    switch (key) {
      case 'firstName':
        return tidy(values.firstName) ? undefined : 'Please enter your first name.'
      case 'lastName':
        return tidy(values.lastName) ? undefined : 'Please enter your surname.'
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
      case 'socials':
        return values.socials.length ? undefined : 'Please choose TikTok, Instagram or N/A.'
      case 'tiktok':
      case 'instagram': {
        if (!values.socials.includes(key)) return undefined
        if (!values[key].trim()) return `Please enter your ${APP_NAME[key]} username.`
        return normaliseHandle(values[key]) ? undefined : 'Just the username: letters, numbers, . or _ (no spaces).'
      }
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

  /* Blur: check just this field, leaving every other field's state alone. */
  // Latest rule + values for checks that run after the current tap ends.
  const ruleRef = useRef(ruleFor)
  ruleRef.current = ruleFor
  const valuesRef = useRef(values)
  valuesRef.current = values

  const runFieldCheck = (key: keyof CommunityValues) => {
    const v = valuesRef.current[key]
    const empty = typeof v === 'string' ? v.trim() === '' : Array.isArray(v) ? v.length === 0 : !v
    const message = ruleRef.current(key)
    setErrors((e) => {
      // Leaving a field empty isn't an error yet — Join will say so.
      if (empty && !e[key]) return e
      return e[key] === message ? e : { ...e, [key]: message }
    })
  }

  const pointerDown = useRef(false)
  const pendingChecks = useRef(new Set<keyof CommunityValues>())
  useEffect(() => {
    const down = () => {
      pointerDown.current = true
    }
    const up = () => {
      pointerDown.current = false
      if (pendingChecks.current.size === 0) return
      const keys = [...pendingChecks.current]
      pendingChecks.current.clear()
      // After the click has landed on whatever she tapped.
      window.setTimeout(() => keys.forEach(runFieldCheck), 0)
    }
    document.addEventListener('pointerdown', down, true)
    document.addEventListener('pointerup', up, true)
    document.addEventListener('pointercancel', up, true)
    return () => {
      document.removeEventListener('pointerdown', down, true)
      document.removeEventListener('pointerup', up, true)
      document.removeEventListener('pointercancel', up, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validateField = (key: keyof CommunityValues) => {
    if (pointerDown.current) pendingChecks.current.add(key)
    else runFieldCheck(key)
  }

  /** Radio groups: only validate when focus leaves the whole group, not while moving between chips. */
  const validateGroupOnBlur = (key: 'relationship' | 'socials' | 'babyStage') => (e: React.FocusEvent<HTMLFieldSetElement>) => {
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
      const el = GROUPS.has(firstKey)
          ? document.querySelector<HTMLElement>(`input[name="${firstKey}"]`)
          : document.getElementById(firstKey)
      el?.focus({ preventScroll: true })
      ;(el?.closest('label, div') ?? el)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return false
    }
    return true
  }

  /** The keyboard's "Next" key moves to the next field instead of submitting. */
  const nextOnEnter = (nextId: keyof CommunityValues) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const el = GROUPS.has(nextId)
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
          {/* First name + surname: stacked on phones, side by side on wider screens */}
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-3">
            <div>
              <label htmlFor="firstName" className={labelClass}>
                First name
              </label>
              <Field icon={<UserIcon size={20} />} invalid={Boolean(errors.firstName)}>
                <input
                  id="firstName"
                  type="text"
                  value={values.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  onBlur={() => validateField('firstName')}
                  autoComplete="given-name"
                  autoCapitalize="words"
                  maxLength={50}
                  enterKeyHint="next"
                  onKeyDown={nextOnEnter('lastName')}
                  data-invalid={Boolean(errors.firstName)}
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  aria-invalid={Boolean(errors.firstName)}
                  placeholder="Your first name"
                  className={inputBase + ' ' + borderFor('firstName')}
                />
              </Field>
              {err('firstName')}
            </div>
            <div>
              <label htmlFor="lastName" className={labelClass}>
                Surname
              </label>
              <Field icon={<UsersIcon size={20} />} invalid={Boolean(errors.lastName)}>
                <input
                  id="lastName"
                  type="text"
                  value={values.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  onBlur={() => validateField('lastName')}
                  autoComplete="family-name"
                  autoCapitalize="words"
                  maxLength={50}
                  enterKeyHint="next"
                  onKeyDown={nextOnEnter('relationship')}
                  data-invalid={Boolean(errors.lastName)}
                  aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  aria-invalid={Boolean(errors.lastName)}
                  placeholder="Your surname"
                  className={inputBase + ' ' + borderFor('lastName')}
                />
              </Field>
              {err('lastName')}
            </div>
          </div>

          {/* Are you… — right after the name */}
          <fieldset
            data-invalid={Boolean(errors.relationship)}
            aria-describedby={errors.relationship ? 'relationship-error' : undefined}
            onBlur={validateGroupOnBlur('relationship')}
          >
            <legend className={labelClass}>Are you…</legend>
            {/* Two columns everywhere; compact chips keep "Grandparent" on one line at 375px. */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {relationships.map((option) => {
                const active = values.relationship === option.value
                const Icon = RELATIONSHIP_ICONS[option.value]
                return (
                  <ChoiceChip
                    compact
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
                onKeyDown={nextOnEnter('socials')}
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
              <p id="mobile-help" className="mt-1.5 text-[11.5px] text-ink-soft/90">
                Philippine mobile number.
              </p>
            )}
          </div>

          {/* TikTok / Instagram: one or both, or N/A */}
          <fieldset
            data-invalid={Boolean(errors.socials)}
            aria-describedby={errors.socials ? 'socials-error' : 'socials-help'}
            onBlur={validateGroupOnBlur('socials')}
          >
            <legend className={labelClass}>TikTok / Instagram</legend>
            <p id="socials-help" className="mt-0.5 text-[11.5px] text-ink-soft/90">
              Tick one or both. No account? Tick N/A.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {SOCIAL_OPTIONS.map(({ value, label, hint, Icon }) => (
                <ChoiceChip
                  compact
                  kind="checkbox"
                  key={value}
                  name="socials"
                  value={value}
                  checked={values.socials.includes(value)}
                  onChange={() => toggleSocial(value)}
                  label={label}
                  hint={hint}
                  icon={<Icon size={18} />}
                  tone={STAGE_TONES.baby}
                  className={value === 'none' ? 'col-span-2' : ''}
                />
              ))}
            </div>
            {err('socials')}
          </fieldset>

          {/* A username box for each app she ticked */}
          {SOCIAL_APPS.filter((app) => values.socials.includes(app)).map((app, i, shown) => (
            <div key={app} className="animate-rise -mt-1">
              <label htmlFor={app} className={labelClass}>
                {APP_NAME[app]} username
              </label>
              <Field icon={<AtSignIcon size={20} />} invalid={Boolean(errors[app])}>
                <input
                  id={app}
                  type="text"
                  value={values[app]}
                  onChange={(e) => set(app, e.target.value)}
                  onBlur={() => validateField(app)}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={80}
                  enterKeyHint="next"
                  onKeyDown={nextOnEnter(shown[i + 1] ?? 'babyStage')}
                  data-invalid={Boolean(errors[app])}
                  aria-describedby={errors[app] ? `${app}-error` : undefined}
                  aria-invalid={Boolean(errors[app])}
                  placeholder="yourusername"
                  className={inputBase + ' ' + borderFor(app)}
                />
              </Field>
              {err(app)}
            </div>
          ))}

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
                Due date <span className="font-normal text-ink-soft/90">(optional)</span>
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
          <p className="text-center text-[11px] leading-relaxed text-ink-soft/90">
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
