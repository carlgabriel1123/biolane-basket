'use client'

import Image from 'next/image'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { babyStages, campaign, type BabyStage } from '@/data/campaign'
import { catalogById, productGroups, products, type CatalogItem, type Product } from '@/data/products'
import { stagePlans } from '@/data/stages'
import type { BasketState, Quantities } from '@/lib/basket'
import { asset } from '@/lib/asset'
import { ChevronDownIcon, GiftIcon, HeartIcon, SparklesIcon, XIcon } from './icons'
import { Button, ChoiceChip, STAGE_TONES, StepIndicator, stageTone } from './ui'
import ProductSection from './ProductSection'
import RewardProgress from './RewardProgress'
import RewardUnlocked from './RewardUnlocked'
import Suggestions from './Suggestions'

interface Props {
  firstName: string
  stage: BabyStage
  quantities: Quantities
  basket: BasketState
  suggestions: Product[]
  personalizationName: string
  onPersonalizationChange: (value: string) => void
  onChangeQty: (id: string, qty: number) => void
  onChangeStage: (stage: BabyStage) => void
  onOpenBasket: () => void
  onStartOver: () => void
}

/** Screen 2: her stage's picks first, everything else folded below. */
export default function ChecklistPage({
  firstName,
  stage,
  quantities,
  basket,
  suggestions,
  personalizationName,
  onPersonalizationChange,
  onChangeQty,
  onChangeStage,
  onOpenBasket,
  onStartOver,
}: Props) {
  const plan = stagePlans[stage]
  const tone = stageTone(stage)
  const StageIcon = tone.Icon
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [seeAllOpen, setSeeAllOpen] = useState(false)
  const seeAllId = useId()
  const [stagePickerOpen, setStagePickerOpen] = useState(false)
  const stagePickerId = useId()
  const changeButtonRef = useRef<HTMLButtonElement>(null)

  const closeStagePicker = () => {
    setStagePickerOpen(false)
    changeButtonRef.current?.focus({ preventScroll: true })
  }

  const [stageAnnouncement, setStageAnnouncement] = useState('')

  const pickStage = (next: BabyStage) => {
    setStagePickerOpen(false)
    changeButtonRef.current?.focus({ preventScroll: true })
    if (next === stage) return
    onChangeStage(next)
    setStageAnnouncement(`Showing the checklist for ${stagePlans[next].label}.`)
  }

  // Land on the heading when the screen opens, for keyboard and screen readers.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  // Priced products and the team's not-yet-priced ones, in the team's order.
  const picks = useMemo(
    () =>
      plan.picks === 'all'
        ? null
        : plan.picks.map((id) => catalogById.get(id)).filter((p): p is CatalogItem => Boolean(p)),
    [plan]
  )

  const pickIds = useMemo(() => new Set(picks?.map((p) => p.id) ?? []), [picks])

  /* ---- "You might also like" ----
   * Her stage's suggestions stay hidden until she adds her first product,
   * then appear under the Checklist and stay (even if she empties it). */
  const recs = useMemo(
    () =>
      picks
        ? plan.suggestions
            .map((id) => catalogById.get(id))
            .filter((p): p is CatalogItem => Boolean(p) && !pickIds.has(p!.id))
        : [],
    [plan, picks, pickIds]
  )
  const recIds = useMemo(() => new Set(recs.map((p) => p.id)), [recs])
  const [recsRevealed, setRecsRevealed] = useState(basket.count > 0)
  useEffect(() => {
    if (basket.count > 0) setRecsRevealed(true)
  }, [basket.count])
  const showRecs = recsRevealed && recs.length > 0
  const recsRef = useRef<HTMLDivElement>(null)
  const recsHeadingId = useId()

  // A one-time nudge above the basket bar, per stage, when the section
  // appears somewhere she can't see it (usually below a long checklist).
  // Coming back to a saved basket doesn't count as "just appeared".
  const nudgedStages = useRef(new Set<BabyStage>(basket.count > 0 ? [stage] : []))
  const [nudge, setNudge] = useState(false)
  const [recsAnnouncement, setRecsAnnouncement] = useState('')
  useEffect(() => {
    if (!showRecs || nudgedStages.current.has(stage)) return
    nudgedStages.current.add(stage)
    setRecsAnnouncement(
      `You might also like ${recs.length} more for ${stageShortName(stage)}, listed under your checklist.`
    )
    const el = recsRef.current
    const box = el?.getBoundingClientRect()
    // Off-screen below (a long checklist) or above (first add from "See all").
    const onScreen = box ? box.top < window.innerHeight - 140 && box.bottom > 0 : true
    setNudge(!onScreen)
  }, [showRecs, stage, recs.length])
  // No section (e.g. switched to Others) → no nudge.
  useEffect(() => {
    if (!showRecs) setNudge(false)
  }, [showRecs])
  const pillRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!nudge) return
    const timer = setTimeout(() => {
      // Never yank the pill away from a keyboard user who is on it.
      if (pillRef.current?.contains(document.activeElement)) return
      setNudge(false)
    }, 8000)
    const el = recsRef.current
    const seen =
      el && 'IntersectionObserver' in window
        ? new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) setNudge(false)
          })
        : null
    if (el && seen) seen.observe(el)
    return () => {
      clearTimeout(timer)
      seen?.disconnect()
    }
  }, [nudge, stage])
  const dismissNudge = () => {
    const hadFocus = pillRef.current?.contains(document.activeElement)
    setNudge(false)
    if (hadFocus) (recsRef.current ?? document.getElementById('basket-status'))?.focus({ preventScroll: true })
  }
  const goToRecs = () => {
    setNudge(false)
    const el = recsRef.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    el.focus({ preventScroll: true })
  }

  // "See all" holds everything not in her Checklist. Once the suggestions
  // section is showing, its products leave "See all" so no card repeats;
  // before that they stay findable there.
  const otherGroups = useMemo(
    () =>
      productGroups
        .map((g) => ({
          ...g,
          items: products.filter((p) => p.group === g.id && !pickIds.has(p.id) && !(showRecs && recIds.has(p.id))),
        }))
        .filter((g) => g.items.length > 0),
    [pickIds, recIds, showRecs]
  )

  // A suggestion product added from "See all" as her first add moves its
  // card into the new section; follow it with focus so + keeps working.
  const changeQty = (id: string, qty: number) => {
    const moves = !showRecs && qty > 0 && recIds.has(id)
    onChangeQty(id, qty)
    if (moves) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document.querySelector<HTMLElement>(`#product-${id} [aria-label^="One more"]`)?.focus({ preventScroll: true })
        )
      )
    }
  }
  const otherCount = otherGroups.reduce((s, g) => s + g.items.length, 0)

  // Ring the suggested cards only while the suggestions panel explains them.
  const suggestedIds = useMemo(
    () => (basket.count > 0 && !basket.unlocked ? new Set(suggestions.map((p) => p.id)) : new Set<string>()),
    [suggestions, basket.count, basket.unlocked]
  )

  // Tapping a suggestion removes it from the list, so hand focus to that
  // product's + button (or the progress card if the product is folded away).
  const addSuggestion = (id: string) => {
    onChangeQty(id, (quantities[id] ?? 0) + 1)
    requestAnimationFrame(() => {
      const plus = document.querySelector<HTMLElement>(`#product-${id} [aria-label^="One more"]`)
      const fallback = document.getElementById('basket-status')
      ;(plus ?? fallback)?.focus({ preventScroll: true })
    })
  }

  return (
    <main
      className="mx-auto max-w-md px-4 md:max-w-3xl lg:max-w-6xl lg:px-8"
      style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}
    >
      <header className="pt-14 md:pt-16">
        <div className="flex items-center justify-between gap-3">
          <Image
            src={asset('/images/brand/biolane-logo.png')}
            alt="Biolane"
            width={547}
            height={159}
            priority
            className="h-auto w-[150px] md:w-[180px]"
          />
          <Button variant="ghost" onClick={onStartOver}>
            Start over
          </Button>
        </div>

        <StepIndicator step={2} total={2} label="Your checklist" className="mt-4" />

        <p className="mt-4 flex items-center gap-2 font-display text-[30px] font-extrabold leading-tight text-blue md:mt-6 md:text-5xl">
          Hi {firstName}
          <HeartIcon size={28} className="shrink-0 text-gold md:h-9 md:w-9" fill="currentColor" strokeWidth={0} />
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-2 outline-none">
          <span className="block font-display text-[22px] font-extrabold leading-tight text-ink md:text-3xl">
            {campaign.checklistHeading}
          </span>
          <span className="mt-1 block font-display text-[17px] font-bold leading-snug text-ink/85 md:text-xl">
            {campaign.checklistSubheading}
          </span>
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft md:text-base">{campaign.checklistIntro}</p>

        {/* The reward, introduced here — right after she joins. */}
        <div className="mt-4 flex items-center gap-3 rounded-card border border-gold/25 bg-cream-soft px-4 py-3 shadow-soft md:max-w-2xl">
          <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-cream text-gold">
            <GiftIcon size={22} />
          </span>
          <p className="text-[13.5px] leading-snug text-ink-soft md:text-[15px]">
            <span className="font-display text-[15px] font-extrabold text-ink md:text-base">
              {campaign.rewardTeaserAmount}
            </span>{' '}
            and get a FREE {campaign.rewardName}!
          </p>
        </div>

        <p className="sr-only" aria-live="polite">
          {stageAnnouncement}
        </p>
        <p className="sr-only" aria-live="polite">
          {recsAnnouncement}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-pill ${tone.tint} px-3 py-1.5 text-[12.5px] font-semibold text-ink`}
          >
            <StageIcon size={16} className={tone.text} />
            {plan.label}
          </span>
          {/* Plain button (not <Button>) so focus can return to it by ref. */}
          <button
            ref={changeButtonRef}
            type="button"
            onClick={() => (stagePickerOpen ? closeStagePicker() : setStagePickerOpen(true))}
            aria-expanded={stagePickerOpen}
            aria-controls={stagePickerId}
            className="press inline-flex min-h-[44px] items-center rounded-pill px-3 text-[13.5px] font-bold text-blue hover:bg-white hover:text-blue-deep"
          >
            {stagePickerOpen ? 'Cancel' : 'Change'}
          </button>
        </div>

        {/* Change the stage right here — no trip back to the sign-up page. */}
        {stagePickerOpen && (
          <div
            id={stagePickerId}
            role="group"
            aria-labelledby={`${stagePickerId}-label`}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation()
                closeStagePicker()
              }
            }}
            className="animate-rise mt-2 rounded-card border border-ink/10 bg-white p-3 shadow-soft sm:p-4"
          >
            <p id={`${stagePickerId}-label`} className="font-display text-[15px] font-extrabold text-ink">
              Change baby stage
            </p>
            <p className="mt-0.5 text-[12.5px] text-ink-soft">
              Your picks update right away. Your basket stays the same.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {babyStages.map(({ value }) => {
                const current = value === stage
                const t = STAGE_TONES[value]
                const Icon = t.Icon
                return (
                  <ChoiceChip
                    key={value}
                    name="checklist-stage"
                    value={value}
                    checked={current}
                    // A new stage arrives as a change; re-picking the current
                    // one only fires click, and just closes the picker.
                    onChange={() => pickStage(value)}
                    onClick={current ? () => pickStage(value) : undefined}
                    tone={t}
                    icon={<Icon size={18} />}
                    label={stagePlans[value].label}
                  />
                )
              })}
            </div>
          </div>
        )}

      </header>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-x-10">
        {/* Her picks (or, for Others, the whole catalogue by category) */}
        <div className="lg:col-start-1 lg:row-start-1">
          {picks ? (
            <>
              <ProductSection
                title={campaign.checklistSectionTitle}
                caption={plan.caption}
                items={picks}
                quantities={quantities}
                suggestedIds={suggestedIds}
                onChange={changeQty}
                priorityFirst
                stage={stage}
              />
              {showRecs && (
                <div
                  ref={recsRef}
                  id="you-might-also-like"
                  role="region"
                  tabIndex={-1}
                  aria-labelledby={recsHeadingId}
                  className="animate-rise mt-6 scroll-mt-6 outline-none"
                >
                  <ProductSection
                    headingId={recsHeadingId}
                    title={campaign.recsTitle}
                    caption={`More favourites for ${stageShortName(stage)}.`}
                    items={recs}
                    quantities={quantities}
                    suggestedIds={suggestedIds}
                    onChange={changeQty}
                    tone="stage"
                    stage={stage}
                    icon={<SparklesIcon size={20} />}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="mb-1 flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-pill ${tone.tint} ${tone.text}`}
                >
                  <StageIcon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-[17px] font-extrabold leading-snug text-ink md:text-xl">
                    {campaign.checklistSectionTitle}
                  </h2>
                  <p className="mt-1 text-[13px] leading-snug text-ink-soft">{plan.caption}</p>
                </div>
              </div>
              {productGroups.map((g, i) => {
                const items = products.filter((p) => p.group === g.id)
                return (
                  <ProductSection
                    key={g.id}
                    headingLevel={3}
                    title={g.title}
                    caption={g.caption}
                    items={items}
                    quantities={quantities}
                    suggestedIds={suggestedIds}
                    onChange={onChangeQty}
                    collapsible
                    defaultOpen={i === 0}
                    tone={g.id === 'justincase' ? 'blush' : 'plain'}
                    priorityFirst={i === 0}
                    stage={stage}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Progress, suggestions and the reward: below her picks on phones,
            a sticky rail beside them on desktop. */}
        <aside
          id="basket-status"
          tabIndex={-1}
          aria-label="Your basket status"
          className="mt-7 flex flex-col gap-4 outline-none md:mx-auto md:max-w-lg lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:max-h-[calc(100dvh-8rem)] lg:w-full lg:self-start lg:overflow-y-auto lg:p-1.5"
        >
          <RewardProgress total={basket.total} remaining={basket.remaining} unlocked={basket.unlocked} />

          {!basket.unlocked && basket.count > 0 && (
            <Suggestions items={suggestions} remaining={basket.remaining} onAdd={addSuggestion} stage={stage} />
          )}

          {basket.unlocked && (
            <RewardUnlocked personalizationName={personalizationName} onChangeName={onPersonalizationChange} />
          )}

          <Button variant="secondary" full onClick={onOpenBasket}>
            Review basket and finish
          </Button>
        </aside>

        {/* Everything else, folded */}
        {picks && otherCount > 0 && (
          <section className="mt-8 lg:col-start-1 lg:row-start-2" aria-labelledby={`${seeAllId}-label`}>
            <h2 className="m-0">
              <button
                type="button"
                onClick={() => setSeeAllOpen((v) => !v)}
                aria-expanded={seeAllOpen}
                aria-controls={seeAllId}
                className="press press-lg flex min-h-[56px] w-full items-center gap-3 rounded-card border border-ink/10 bg-white px-4 py-3 text-left shadow-soft hover:border-blue/40"
              >
                <span className="min-w-0 flex-1">
                  <span id={`${seeAllId}-label`} className="block font-display text-[16px] font-extrabold text-ink">
                    See all Biolane products
                  </span>
                  <span className="block text-[12.5px] text-ink-soft">
                    {otherCount} more, by category
                  </span>
                </span>
                <ChevronDownIcon
                  size={20}
                  className={`shrink-0 text-ink-soft transition-transform duration-200 ${seeAllOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </h2>

            {seeAllOpen && (
              <div id={seeAllId} className="animate-rise mt-3 flex flex-col gap-3">
                {otherGroups.map((g) => (
                  <ProductSection
                    key={g.id}
                    title={g.title}
                    caption={g.caption}
                    items={g.items}
                    quantities={quantities}
                    suggestedIds={suggestedIds}
                    onChange={changeQty}
                    collapsible
                    defaultOpen={false}
                    tone={g.id === 'justincase' ? 'blush' : 'plain'}
                    headingLevel={3}
                    stage={stage}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {nudge && showRecs && (
        <div
          className="animate-rise fixed inset-x-0 z-30 flex justify-center px-4"
          style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
        >
          <div ref={pillRef} className="flex items-center gap-1 rounded-pill bg-ink py-1 pl-1 pr-1 text-white shadow-lift">
            <button
              type="button"
              onClick={goToRecs}
              className="press flex min-h-[44px] items-center gap-2 rounded-pill px-4 py-1.5 text-left text-[13.5px] font-semibold leading-snug hover:bg-white/10"
            >
              <SparklesIcon size={16} className="shrink-0 text-gold-soft" />
              <span>
                {campaign.recsTitle}: {recs.length} more{' '}
                <span className="font-bold text-sky underline underline-offset-4">See them</span>
              </span>
            </button>
            <button
              type="button"
              onClick={dismissNudge}
              aria-label="Dismiss"
              className="press grid h-11 w-11 place-items-center rounded-pill text-white/70 hover:bg-white/10 hover:text-white"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>
      )}

      <footer className="mt-10 text-center text-[11px] leading-relaxed text-ink-soft/60 md:text-xs">
        <p>{campaign.promoDates}</p>
        <p className="mt-1">{campaign.rewardDisclaimer}</p>
      </footer>
    </main>
  )
}

/** "Baby · 0 to 12 months" → "Baby". */
function stageShortName(stage: BabyStage): string {
  return stagePlans[stage].label.split(' · ')[0]
}
