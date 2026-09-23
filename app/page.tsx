'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import JoinPage from '@/components/JoinPage'
import ChecklistPage from '@/components/ChecklistPage'
import Confirmation from '@/components/Confirmation'
import BasketBar from '@/components/BasketBar'
import BasketSheet from '@/components/BasketSheet'
import type { CommunityValues } from '@/components/CommunityForm'
import { campaign, type BabyStage } from '@/data/campaign'
import { productById, products, type Product } from '@/data/products'
import { stagePlans } from '@/data/stages'
import {
  computeBasket,
  sanitiseQuantities,
  setQty,
  suggestProducts,
  type Quantities,
} from '@/lib/basket'
import { makeProgressTracker, track } from '@/lib/analytics'
import { newSubmissionId, sendSubmission, type Submission } from '@/lib/submission'
import { normalisePhMobile, tidy } from '@/lib/validate'

/**
 * Three screens in one page:
 *   join      → the Biolane Mom Community sign-up (saves the lead)
 *   checklist → her stage's picks, quantities, reward
 *   done      → confirmation to show at the booth
 * The browser Back button walks back through them. The live session sits in
 * sessionStorage (this tab only) so a refresh keeps her place; finishing or
 * Start over wipes it, so the next mom never sees the last one's details.
 */

type Step = 'join' | 'checklist' | 'done'

const SESSION_KEY = 'biolane-nesting-session'

const EMPTY_FORM: CommunityValues = {
  name: '',
  email: '',
  mobile: '',
  babyStage: '',
  dueDate: '',
  consent: false, // never pre-checked, on every render path
}

interface SavedSession {
  step: Step
  form: CommunityValues
  quantities: Quantities
  personalizationName: string
  submissionId: string | null
}

export default function Page() {
  const [step, setStep] = useState<Step>('join')
  const [form, setForm] = useState<CommunityValues>(EMPTY_FORM)
  const [quantities, setQuantities] = useState<Quantities>({})
  const [personalizationName, setPersonalizationName] = useState('')
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [result, setResult] = useState<{ submission: Submission; storedRemotely: boolean } | null>(null)

  const hydrated = useRef(false)
  const stepRef = useRef<Step>('join')
  const joinedRef = useRef(false)
  const progressTracker = useRef(makeProgressTracker())
  const unlockAnnounced = useRef(false)

  stepRef.current = step
  joinedRef.current = submissionId !== null

  const stage = (form.babyStage || 'others') as BabyStage
  const basket = useMemo(() => computeBasket(quantities), [quantities])

  const stagePool = useMemo<Product[]>(() => {
    const picks = stagePlans[stage].picks
    return picks === 'all'
      ? products
      : picks.map((id) => productById.get(id)).filter((p): p is Product => Boolean(p))
  }, [stage])

  const suggestions = useMemo(() => suggestProducts(quantities, stagePool), [quantities, stagePool])

  /* ---------------- navigation ---------------- */
  const goTo = useCallback((next: Step) => {
    window.history.pushState({ step: next }, '')
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  /* ---------------- restore + Back button ---------------- */
  useEffect(() => {
    let initial: Step = 'join'
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SavedSession>
        if (saved.form) setForm({ ...EMPTY_FORM, ...saved.form })
        setQuantities(sanitiseQuantities(saved.quantities))
        if (typeof saved.personalizationName === 'string') setPersonalizationName(saved.personalizationName)
        if (typeof saved.submissionId === 'string') {
          setSubmissionId(saved.submissionId)
          joinedRef.current = true
          if (saved.step === 'checklist') initial = 'checklist'
        }
      }
    } catch {
      // Blocked storage — start clean.
    }
    setStep(initial)
    window.history.replaceState({ step: initial }, '')
    hydrated.current = true

    const onPop = (e: PopStateEvent) => {
      // The confirmation is a terminal, read-only state: Back stays on it.
      if (stepRef.current === 'done') {
        window.history.pushState({ step: 'done' }, '')
        return
      }
      const target = ((e.state as { step?: Step } | null)?.step ?? 'join') as Step
      const allowed: Step = target === 'checklist' && joinedRef.current ? 'checklist' : 'join'
      setSheetOpen(false)
      setStep(allowed)
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (!hydrated.current || step === 'done') return
    try {
      const session: SavedSession = { step, form, quantities, personalizationName, submissionId }
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch {
      /* storage unavailable — everything still works in memory */
    }
  }, [step, form, quantities, personalizationName, submissionId])

  /* ---------------- analytics ---------------- */
  useEffect(() => {
    if (step !== 'checklist') return
    progressTracker.current(basket.total, campaign.rewardThreshold)
    if (basket.unlocked && !unlockAnnounced.current) {
      unlockAnnounced.current = true
      track('reward_unlocked', { total: basket.total })
    }
    if (!basket.unlocked) unlockAnnounced.current = false
  }, [step, basket.total, basket.unlocked])

  /* ---------------- building the record ---------------- */
  const buildSubmission = useCallback(
    (id: string, event: Submission['event']): Submission => ({
      submissionId: id,
      timestamp: new Date().toISOString(),
      event,
      name: tidy(form.name),
      email: form.email.trim(),
      mobile: normalisePhMobile(form.mobile) ?? form.mobile.trim(),
      babyStage: stage,
      ...(form.babyStage === 'expecting' && form.dueDate ? { dueDate: form.dueDate } : {}),
      marketingConsent: form.consent,
      selectedProducts: basket.lines.map(({ product, qty, lineTotal }) => ({
        id: product.id,
        name: product.name,
        size: product.size,
        gbfSku: product.gbfSku,
        price: product.price,
        qty,
        lineTotal,
      })),
      basketTotal: basket.total,
      rewardUnlocked: basket.unlocked,
      ...(basket.unlocked && personalizationName.trim()
        ? { personalizationName: tidy(personalizationName) }
        : {}),
    }),
    [form, stage, basket, personalizationName]
  )

  /* ---------------- actions ---------------- */
  const handleJoin = useCallback(() => {
    const id = submissionId ?? newSubmissionId()
    const firstTime = submissionId === null
    setSubmissionId(id)
    joinedRef.current = true
    // Save the lead now, so a mom who stops here is still captured. Not
    // awaited: slow booth wifi must never hold her on the form.
    void sendSubmission(buildSubmission(id, 'signup'))
    if (firstTime) {
      track('community_signup_completed', { stage })
      track('nesting_started', { stage })
    }
    goTo('checklist')
  }, [submissionId, buildSubmission, stage, goTo])

  const changeQty = useCallback(
    (id: string, qty: number) => {
      const before = quantities[id] ?? 0
      const next = setQty(quantities, id, qty)
      const after = next[id] ?? 0
      if (after === before) return
      setQuantities(next)
      if (before === 0) track('product_selected', { id })
      else if (after === 0) track('product_removed', { id })
      else track('quantity_changed', { id, qty: after })
    },
    [quantities]
  )

  const openBasket = useCallback(() => {
    setSheetOpen(true)
    track('basket_opened', { units: basket.units, total: basket.total })
  }, [basket.units, basket.total])

  const closeBasket = useCallback(() => setSheetOpen(false), [])

  const goToPersonalization = useCallback(() => {
    setSheetOpen(false)
    // Wait for the sheet to unmount and the scroll lock to lift.
    window.setTimeout(() => {
      const input = document.getElementById('personalization')
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      input?.focus({ preventScroll: true })
    }, 60)
  }, [])

  const handleFinish = useCallback(async () => {
    if (finishing || basket.count === 0 || !submissionId) return
    setFinishing(true) // synchronous — blocks the double-tap
    const submission = buildSubmission(submissionId, 'checklist_completed')
    const storedRemotely = await sendSubmission(submission)
    track('form_submitted', { total: basket.total, units: basket.units, unlocked: basket.unlocked })
    setResult({ submission, storedRemotely })
    setSheetOpen(false)
    setFinishing(false)
    try {
      window.sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    goTo('done')
  }, [finishing, basket, submissionId, buildSubmission, goTo])

  const handleStartOver = useCallback(() => {
    if (stepRef.current !== 'done' && !window.confirm('Clear this session? The next mom starts fresh.')) {
      return
    }
    try {
      window.sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    setForm(EMPTY_FORM)
    setQuantities({})
    setPersonalizationName('')
    setSubmissionId(null)
    joinedRef.current = false
    setSheetOpen(false)
    setResult(null)
    unlockAnnounced.current = false
    progressTracker.current = makeProgressTracker()
    window.history.replaceState({ step: 'join' }, '')
    setStep('join')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  /* ---------------- screens ---------------- */
  if (step === 'done' && result) {
    return (
      <Confirmation
        submission={result.submission}
        storedRemotely={result.storedRemotely}
        onStartOver={handleStartOver}
      />
    )
  }

  if (step === 'checklist' && submissionId) {
    return (
      <>
        <ChecklistPage
          firstName={tidy(form.name).split(' ')[0] || 'Mommy'}
          stage={stage}
          quantities={quantities}
          basket={basket}
          suggestions={suggestions}
          personalizationName={personalizationName}
          onPersonalizationChange={setPersonalizationName}
          onChangeQty={changeQty}
          onChangeStage={() => goTo('join')}
          onOpenBasket={openBasket}
          onStartOver={handleStartOver}
        />
        <BasketBar
          count={basket.count}
          units={basket.units}
          total={basket.total}
          remaining={basket.remaining}
          unlocked={basket.unlocked}
          onOpen={openBasket}
        />
        <BasketSheet
          open={sheetOpen}
          basket={basket}
          personalizationName={personalizationName}
          finishing={finishing}
          onChange={changeQty}
          onClose={closeBasket}
          onFinish={handleFinish}
          onGoToPersonalization={goToPersonalization}
        />
      </>
    )
  }

  return (
    <JoinPage
      values={form}
      onChange={setForm}
      onSubmit={handleJoin}
      submitting={false}
      returning={submissionId !== null}
    />
  )
}
