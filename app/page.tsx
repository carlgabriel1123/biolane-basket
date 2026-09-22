'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Hero from '@/components/Hero'
import ProductSection from '@/components/ProductSection'
import RewardProgress from '@/components/RewardProgress'
import Suggestions from '@/components/Suggestions'
import RewardUnlocked from '@/components/RewardUnlocked'
import CommunityForm, { type CommunityValues } from '@/components/CommunityForm'
import Confirmation from '@/components/Confirmation'
import BasketBar from '@/components/BasketBar'
import { campaign } from '@/data/campaign'
import { products, productGroups } from '@/data/products'
import { computeBasket, sanitiseIds, suggestProducts } from '@/lib/basket'
import { makeProgressTracker, track } from '@/lib/analytics'
import { submitChecklist, type Submission } from '@/lib/submission'
import { tidy, normalisePhMobile } from '@/lib/validate'

const BASKET_KEY = 'biolane-nesting-basket'
const RESTORE_WINDOW_MS = 10 * 60 * 1000

const EMPTY_FORM: CommunityValues = {
  name: '',
  email: '',
  mobile: '',
  babyStage: '',
  dueDate: '',
  consent: false, // never pre-checked, on every render path
}

export default function Page() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [started, setStarted] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [restored, setRestored] = useState(false)

  // These live OUTSIDE the basket, so unchecking a product never wipes them.
  const [personalizationName, setPersonalizationName] = useState('')
  const [form, setForm] = useState<CommunityValues>(EMPTY_FORM)

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ submission: Submission; storedRemotely: boolean } | null>(
    null
  )

  const checklistRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const progressTracker = useRef(makeProgressTracker())
  const unlockAnnounced = useRef(false)

  const basket = useMemo(() => computeBasket(selectedIds), [selectedIds])
  const suggestions = useMemo(() => suggestProducts(selectedIds), [selectedIds])
  // Only ring cards once the Suggestions panel is actually on screen to
  // explain them — otherwise the gold rings read as unexplained decoration.
  const suggestedIds = useMemo(
    () =>
      basket.count > 0 && !basket.unlocked
        ? new Set(suggestions.map((p) => p.id))
        : new Set<string>(),
    [suggestions, basket.count, basket.unlocked]
  )

  /* ---------------- restore: basket only, never PII ---------------- */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BASKET_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { ids: string[]; at: number }
      if (!parsed?.at || Date.now() - parsed.at > RESTORE_WINDOW_MS) {
        window.localStorage.removeItem(BASKET_KEY)
        return
      }
      const ids = sanitiseIds(parsed.ids ?? [])
      if (ids.size > 0) {
        setSelectedIds(ids)
        setStarted(true)
        setRestored(true)
      }
    } catch {
      // Private mode / blocked storage — carry on with a clean basket.
    }
  }, [])

  useEffect(() => {
    try {
      if (selectedIds.size === 0) window.localStorage.removeItem(BASKET_KEY)
      else
        window.localStorage.setItem(
          BASKET_KEY,
          JSON.stringify({ ids: [...selectedIds], at: Date.now() })
        )
    } catch {
      /* storage unavailable — the app still works fully in memory */
    }
  }, [selectedIds])

  /* ---------------- analytics ---------------- */
  useEffect(() => {
    progressTracker.current(basket.total, campaign.rewardThreshold)
    if (basket.unlocked && !unlockAnnounced.current) {
      unlockAnnounced.current = true
      track('reward_unlocked', { total: basket.total })
    }
    if (!basket.unlocked) unlockAnnounced.current = false
  }, [basket.total, basket.unlocked])

  /* ---------------- actions ---------------- */
  const handleStart = useCallback(() => {
    setStarted(true)
    track('nesting_started')
    requestAnimationFrame(() => {
      checklistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const toggle = useCallback((id: string) => {
    setStarted(true)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        track('product_removed', { id })
      } else {
        next.add(id)
        track('product_selected', { id })
      }
      return next
    })
  }, [])

  const handleContinue = useCallback(() => {
    setShowForm(true)
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const handleStartOver = useCallback(() => {
    if (
      result === null &&
      !window.confirm('Clear this session? The next mom starts fresh.')
    ) {
      return
    }
    try {
      window.localStorage.removeItem(BASKET_KEY)
    } catch {
      /* ignore */
    }
    setSelectedIds(new Set())
    setPersonalizationName('')
    setForm(EMPTY_FORM)
    setShowForm(false)
    setStarted(false)
    setRestored(false)
    setResult(null)
    unlockAnnounced.current = false
    progressTracker.current = makeProgressTracker()
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [result])

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true) // synchronous — blocks the double-tap
    track('community_signup_completed')

    const snapshot = {
      name: tidy(form.name),
      email: form.email.trim(),
      mobile: normalisePhMobile(form.mobile) ?? form.mobile.trim(),
      babyStage: form.babyStage as Exclude<CommunityValues['babyStage'], ''>,
      ...(form.babyStage === 'expecting' && form.dueDate ? { dueDate: form.dueDate } : {}),
      marketingConsent: form.consent,
      selectedProducts: basket.selected.map((p) => ({
        id: p.id,
        name: p.name,
        size: p.size,
        gbfSku: p.gbfSku,
        price: p.price,
      })),
      basketTotal: basket.total,
      rewardUnlocked: basket.unlocked,
      ...(basket.unlocked && personalizationName.trim()
        ? { personalizationName: tidy(personalizationName) }
        : {}),
    }

    const res = await submitChecklist(snapshot)
    track('form_submitted', { total: basket.total, unlocked: basket.unlocked })

    if (res.ok) {
      setResult({
        submission: {
          ...snapshot,
          submissionId: res.submissionId,
          timestamp: new Date().toISOString(),
        },
        storedRemotely: res.storedRemotely,
      })
      try {
        window.localStorage.removeItem(BASKET_KEY)
      } catch {
        /* ignore */
      }
    }
    setSubmitting(false)
  }, [submitting, form, basket, personalizationName])

  /* ---------------- terminal state ---------------- */
  if (result) {
    return (
      <Confirmation
        submission={result.submission}
        storedRemotely={result.storedRemotely}
        onStartOver={handleStartOver}
      />
    )
  }

  const grouped = productGroups.map((g) => ({
    ...g,
    items: products.filter((p) => p.group === g.id),
  }))

  return (
    <>
      <Hero onStart={handleStart} />

      {/* Bottom padding clears the sticky basket bar + the iOS home indicator. */}
      <main
        className="mx-auto max-w-md px-4 md:max-w-3xl lg:max-w-6xl lg:px-8"
        style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}
      >
        {restored && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-cream-soft px-4 py-3">
            <p className="flex-1 text-[12.5px] leading-snug text-ink-soft">
              We restored your earlier selection.
            </p>
            <button
              type="button"
              onClick={handleStartOver}
              className="min-h-[44px] shrink-0 rounded-full border border-ink/15 px-3 text-[12px] font-semibold text-ink"
            >
              Start over
            </button>
          </div>
        )}

        <div ref={checklistRef} className="scroll-mt-4 pt-6 md:pt-10 md:text-center lg:text-left">
          <h2 className="font-display text-[22px] font-extrabold leading-tight text-ink md:text-3xl">
            Biolane Nesting Checklist
          </h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft md:text-[15px]">
            Tick what you&rsquo;re taking home. Most moms unlock the bag with 3&ndash;4
            essentials.
          </p>
          <p className="mt-2 rounded-lg bg-sky-soft px-3 py-2 text-[11.5px] leading-relaxed text-ink-soft/85 md:inline-block md:text-xs">
            This is a checklist, not a checkout &mdash; nothing is purchased or charged here.
          </p>
        </div>

        {/*
          Phones: products, then progress/reward stacked below.
          Desktop (lg+): products on the left, a sticky status rail on the right.
        */}
        <div className="lg:mt-2 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10">
          <fieldset className="mt-5 flex flex-col gap-7 border-0 p-0 md:gap-9">
            <legend className="sr-only">
              Choose the Biolane essentials you are taking home
            </legend>

            {grouped.map((g, i) => (
              <ProductSection
                key={g.id}
                groupId={g.id}
                title={g.title}
                caption={g.caption}
                items={g.items}
                selectedIds={selectedIds}
                suggestedIds={suggestedIds}
                onToggle={toggle}
                priorityFirst={i === 0}
              />
            ))}
          </fieldset>

          {/*
            Phones/iPad portrait: appears below the products once she starts,
            capped to the same width as the form beneath it.
            Desktop: always visible in the right rail (progress reads ₱0 before
            she starts, so the column is never blank), sticky, and it scrolls
            internally rather than sliding under the fixed basket bar.
          */}
          <aside
            aria-label="Your basket status"
            className={
              started
                ? 'mt-7 flex w-full flex-col gap-4 md:mx-auto md:max-w-lg lg:sticky lg:top-6 lg:mt-5 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto'
                : 'hidden lg:sticky lg:top-6 lg:mt-5 lg:flex lg:flex-col lg:gap-4'
            }
          >
            <RewardProgress
              total={basket.total}
              remaining={basket.remaining}
              unlocked={basket.unlocked}
            />

            {started && !basket.unlocked && basket.count > 0 && (
              <Suggestions
                items={suggestions}
                remaining={basket.remaining}
                onAdd={toggle}
              />
            )}

            {started && basket.unlocked && (
              <RewardUnlocked
                personalizationName={personalizationName}
                onChangeName={setPersonalizationName}
              />
            )}

            {/* Values are retained verbatim if the basket drops back below. */}
            {started && basket.unlocked && personalizationName === '' && (
              <p className="sr-only">Enter a name to personalize your bag.</p>
            )}
          </aside>
        </div>

        <div ref={formRef} className="scroll-mt-4 md:mx-auto md:max-w-lg">
          {showForm && (
            <div className="mt-7 md:mt-10">
              <CommunityForm
                values={form}
                onChange={setForm}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            </div>
          )}
        </div>

        <div className="md:mx-auto md:max-w-lg">
          {started && (
            <button
              type="button"
              onClick={handleStartOver}
              className="mt-8 min-h-[44px] w-full rounded-full border border-ink/10 px-4 text-[12.5px] font-semibold text-ink-soft/80 transition-colors hover:border-blue hover:text-blue"
            >
              Start over for the next mom
            </button>
          )}

          <footer className="mt-6 text-center text-[11px] leading-relaxed text-ink-soft/60 md:text-xs">
            <p>{campaign.promoDates}</p>
            <p className="mt-1">{campaign.rewardDisclaimer}</p>
          </footer>
        </div>
      </main>

      <BasketBar
        visible={started && !showForm}
        count={basket.count}
        total={basket.total}
        remaining={basket.remaining}
        unlocked={basket.unlocked}
        onContinue={handleContinue}
      />
    </>
  )
}
