'use client'

import Image from 'next/image'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { babyStages, campaign, type BabyStage } from '@/data/campaign'
import { productById, productGroups, products, type Product } from '@/data/products'
import { stagePlans } from '@/data/stages'
import type { BasketState, Quantities } from '@/lib/basket'
import { asset } from '@/lib/asset'
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

  const pickStage = (next: BabyStage) => {
    setStagePickerOpen(false)
    if (next === stage) {
      changeButtonRef.current?.focus({ preventScroll: true })
      return
    }
    // The new heading takes focus (effect below) so the change is announced.
    onChangeStage(next)
  }

  // Land on the heading when the screen opens, for keyboard and screen readers.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [stage])

  const picks = useMemo(
    () =>
      plan.picks === 'all'
        ? null
        : plan.picks.map((id) => productById.get(id)).filter((p): p is Product => Boolean(p)),
    [plan]
  )

  const pickIds = useMemo(() => new Set(picks?.map((p) => p.id) ?? []), [picks])

  // "See all" holds only what isn't already in her picks, so nothing repeats.
  const otherGroups = useMemo(
    () =>
      productGroups
        .map((g) => ({ ...g, items: products.filter((p) => p.group === g.id && !pickIds.has(p.id)) }))
        .filter((g) => g.items.length > 0),
    [pickIds]
  )
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
      <header className="pt-5 md:pt-8">
        <div className="flex items-center justify-between gap-3">
          <Image
            src={asset('/images/brand/biolane-logo.png')}
            alt="Biolane"
            width={104}
            height={30}
            className="h-auto w-[96px]"
          />
          <button
            type="button"
            onClick={onStartOver}
            className="min-h-[44px] rounded-full px-3 text-[12.5px] font-semibold text-ink-soft/80 hover:text-blue"
          >
            Start over
          </button>
        </div>

        <p className="mt-5 text-[14px] font-semibold text-blue">
          Hi {firstName} <span aria-hidden="true">💛</span>
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 font-display text-[26px] font-extrabold leading-tight text-ink outline-none md:text-4xl"
        >
          {plan.title}
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft md:text-[15px]">{plan.caption}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sky px-3 py-1.5 text-[12.5px] font-semibold text-ink">
            {plan.label}
          </span>
          <button
            ref={changeButtonRef}
            type="button"
            onClick={() => (stagePickerOpen ? closeStagePicker() : setStagePickerOpen(true))}
            aria-expanded={stagePickerOpen}
            aria-controls={stagePickerId}
            className="min-h-[44px] rounded-full px-3 text-[13px] font-semibold text-blue underline underline-offset-4 hover:text-blue-deep"
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
            <div className="mt-3 flex flex-wrap gap-2">
              {babyStages.map(({ value }) => {
                const current = value === stage
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => pickStage(value)}
                    aria-pressed={current}
                    className={`min-h-[44px] rounded-full border-2 px-4 text-[13px] font-semibold transition-colors ${
                      current
                        ? 'border-blue bg-blue text-white'
                        : 'border-ink/15 bg-white text-ink hover:border-blue hover:text-blue'
                    }`}
                  >
                    {current && (
                      <span aria-hidden="true" className="mr-1">
                        ✓
                      </span>
                    )}
                    {stagePlans[value].label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <p className="mt-2 text-[12px] leading-relaxed text-ink-soft/80">
          This is a checklist, not a checkout — nothing is charged here. Tap Add, then use − and + for
          more than one.
        </p>
      </header>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-x-10">
        {/* Her picks (or, for Others, the whole catalogue by category) */}
        <div className="lg:col-start-1 lg:row-start-1">
          {picks ? (
            <ProductSection
              title="Picked for you"
              caption={`${picks.length} essentials for this stage, most important first.`}
              items={picks}
              quantities={quantities}
              suggestedIds={suggestedIds}
              onChange={onChangeQty}
              priorityFirst
            />
          ) : (
            <div className="flex flex-col gap-3">
              {productGroups.map((g, i) => {
                const items = products.filter((p) => p.group === g.id)
                return (
                  <ProductSection
                    key={g.id}
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
            <Suggestions items={suggestions} remaining={basket.remaining} onAdd={addSuggestion} />
          )}

          {basket.unlocked && (
            <RewardUnlocked personalizationName={personalizationName} onChangeName={onPersonalizationChange} />
          )}

          <button
            type="button"
            onClick={onOpenBasket}
            className="min-h-[48px] w-full rounded-full border-2 border-blue px-5 text-[14px] font-bold text-blue transition-colors hover:bg-blue hover:text-white"
          >
            Review basket and finish
          </button>
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
                className="flex min-h-[56px] w-full items-center gap-3 rounded-card border border-ink/10 bg-white px-4 py-3 text-left shadow-soft transition-colors hover:border-blue/40"
              >
                <span className="min-w-0 flex-1">
                  <span id={`${seeAllId}-label`} className="block font-display text-[16px] font-extrabold text-ink">
                    See all Biolane products
                  </span>
                  <span className="block text-[12.5px] text-ink-soft">
                    {otherCount} more, by category
                  </span>
                </span>
                <svg
                  viewBox="0 0 20 20"
                  className={`h-5 w-5 shrink-0 text-ink-soft transition-transform duration-200 ${seeAllOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
                    onChange={onChangeQty}
                    collapsible
                    defaultOpen={false}
                    tone={g.id === 'justincase' ? 'blush' : 'plain'}
                    headingLevel={3}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <footer className="mt-10 text-center text-[11px] leading-relaxed text-ink-soft/60 md:text-xs">
        <p>{campaign.promoDates}</p>
        <p className="mt-1">{campaign.rewardDisclaimer}</p>
      </footer>
    </main>
  )
}
