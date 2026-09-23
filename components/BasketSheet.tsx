'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { campaign, type BabyStage } from '@/data/campaign'
import type { BasketState } from '@/lib/basket'
import { asset } from '@/lib/asset'
import { peso } from '@/lib/format'
import { isPrintableBagName } from '@/lib/validate'
import { BagIcon, CheckIcon, XIcon } from './icons'
import { Button, stageTone } from './ui'
import QtyStepper from './QtyStepper'

interface Props {
  open: boolean
  basket: BasketState
  personalizationName: string
  finishing: boolean
  onChange: (id: string, qty: number) => void
  onClose: () => void
  onFinish: () => void
  /** Close the sheet and take her to the bag-name field. */
  onGoToPersonalization: () => void
  /** Tints the line-item thumbnails with her stage's colour. */
  stage?: BabyStage
}

/** Phones get a bottom sheet that slides up; wider screens a centred card that rises. */
function useWideScreen(): boolean {
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setWide(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return wide
}

export default function BasketSheet({
  open,
  basket,
  personalizationName,
  finishing,
  onChange,
  onClose,
  onFinish,
  onGoToPersonalization,
  stage,
}: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const wide = useWideScreen()
  const well = stage ? stageTone(stage).tint : 'bg-sky-soft'

  // Focus, Escape, background scroll lock, and a simple focus trap.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  // Removing a line unmounts the stepper she was using; keep focus inside
  // the dialog instead of letting it fall back to the page behind.
  const lineCount = basket.lines.length
  useEffect(() => {
    if (!open) return
    if (document.activeElement === document.body || !panelRef.current?.contains(document.activeElement)) {
      closeRef.current?.focus({ preventScroll: true })
    }
  }, [open, lineCount])

  if (!open) return null

  const pct = Math.min(100, Math.round((basket.total / campaign.rewardThreshold) * 100))
  // A name the vendor can't print counts as no name yet.
  const bagName = personalizationName.trim()
  const hasValidBagName = bagName !== '' && isPrintableBagName(bagName)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <button
        type="button"
        aria-label="Close basket"
        tabIndex={-1}
        onClick={onClose}
        className="animate-fade absolute inset-0 cursor-default bg-ink/45"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="basket-sheet-title"
        className={`${wide ? 'animate-rise' : 'animate-slide-up'} relative flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-[1.75rem] bg-white shadow-lift md:rounded-card`}
      >
        {/* Decorative drag handle: this is a sheet you can pull down. */}
        <span aria-hidden="true" className="mx-auto mt-2.5 block h-1.5 w-10 shrink-0 rounded-pill bg-ink/15 md:hidden" />

        <div className="flex items-center gap-3 border-b border-ink/10 px-5 pb-3 pt-3 md:pt-4">
          <div className="min-w-0 flex-1">
            <h2 id="basket-sheet-title" className="font-display text-[19px] font-extrabold text-ink">
              Your nesting basket
            </h2>
            <p className="text-[12.5px] tabular-nums text-ink-soft">
              {basket.units} {basket.units === 1 ? 'item' : 'items'} ·{' '}
              {basket.count} {basket.count === 1 ? 'product' : 'products'}
            </p>
          </div>
          {/* Plain button (not <IconButton>) so the focus-trap ref can land on it. */}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close basket"
            className="press grid h-11 w-11 shrink-0 place-items-center rounded-pill text-ink-soft hover:bg-sky-soft hover:text-blue"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {basket.lines.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <span aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-pill bg-sky text-blue">
                <BagIcon size={28} />
              </span>
              <p className="mt-3 font-display text-[16px] font-bold text-ink">Your basket is empty</p>
              <p className="mt-1 text-[13px] text-ink-soft">
                Add essentials from your checklist and they&rsquo;ll appear here.
              </p>
              <Button variant="secondary" onClick={onClose} className="mt-4">
                Back to checklist
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-ink/10">
              {basket.lines.map(({ product, qty, lineTotal }) => (
                <li key={product.id} className="flex items-center gap-3 py-3">
                  <span className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ${well}`}>
                    <Image src={asset(product.image)} alt="" fill sizes="56px" className="object-contain p-1.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold leading-snug text-ink">
                      {product.name}
                    </span>
                    <span className="block text-[12px] tabular-nums text-ink-soft/80">
                      {product.size ? `${product.size} · ` : ''}
                      {peso(product.price)} each
                    </span>
                    <span className="mt-0.5 block font-display text-[15px] font-extrabold tabular-nums text-blue">
                      {peso(lineTotal)}
                    </span>
                  </span>
                  <QtyStepper
                    name={product.size ? `${product.name} ${product.size}` : product.name}
                    qty={qty}
                    size="sm"
                    onChange={(n) => onChange(product.id, n)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="border-t border-ink/10 px-5 pt-3"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <div className="h-2 w-full overflow-hidden rounded-pill bg-sky">
            <div
              className={`progress-fill h-full rounded-pill ${
                basket.unlocked ? 'bg-gradient-to-r from-gold-soft to-gold' : 'bg-blue'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-[12.5px] text-ink-soft">
            {basket.unlocked ? (
              hasValidBagName ? (
                <>
                  <span className="font-semibold text-gold">Gift unlocked</span> · bag
                  personalized with &ldquo;{bagName}&rdquo;
                </>
              ) : (
                <>
                  <span className="font-semibold text-gold">Gift unlocked.</span>{' '}
                  <button
                    type="button"
                    onClick={onGoToPersonalization}
                    className="inline-flex min-h-[44px] items-center font-semibold text-blue underline underline-offset-2"
                  >
                    {bagName ? 'Fix the name on your bag' : 'Add a name for your bag'}
                  </button>
                </>
              )
            ) : (
              <>
                <span className="font-semibold text-ink">{peso(basket.remaining)} more</span> to
                unlock your free {campaign.rewardShortName.toLowerCase()}.
              </>
            )}
          </p>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">
                Total
              </p>
              <p className="font-display text-[24px] font-extrabold leading-none tabular-nums text-ink">
                {peso(basket.total)}
              </p>
            </div>
            <Button
              size="lg"
              onClick={onFinish}
              loading={finishing}
              disabled={finishing || basket.count === 0}
              iconRight={<CheckIcon size={20} />}
            >
              {finishing ? 'Saving…' : 'Finish checklist'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
