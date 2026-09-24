'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import JoinPage from '@/components/JoinPage'
import ChecklistPage from '@/components/ChecklistPage'
import Confirmation from '@/components/Confirmation'
import BasketBar from '@/components/BasketBar'
import BasketSheet from '@/components/BasketSheet'
import NurseryBackdrop from '@/components/NurseryBackdrop'
import { socialsFor, type CommunityValues, type Social } from '@/components/CommunityForm'
import { campaign, relationships, type BabyStage, type Relationship } from '@/data/campaign'
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
import {
  flushPending,
  newSubmissionId,
  newWriteKey,
  nextSeq,
  sendSubmission,
  type Submission,
} from '@/lib/submission'
import { isPrintableBagName, normalisePhMobile, tidy } from '@/lib/validate'

/**
 * Three screens in one page:
 *   join      → the Biolane Mom Community sign-up (saves the lead)
 *   checklist → her stage's picks, quantities, reward
 *   done      → confirmation to show at the booth
 *
 * History: every entry we write SPREADS the existing history.state, because
 * the Next.js router keeps its own keys there — dropping them makes every
 * Back press a full page reload. The basket sheet gets its own entry so the
 * phone's Back button closes it.
 *
 * The live session sits in sessionStorage (this tab only) so a refresh keeps
 * her place, including the confirmation. Start over wipes it.
 */

type Step = 'join' | 'checklist' | 'done'
type Result = { submission: Submission; storedRemotely: boolean }

const SESSION_KEY = 'biolane-nesting-session'

const EMPTY_FORM: CommunityValues = {
  name: '',
  relationship: '',
  relationshipOther: '',
  email: '',
  mobile: '',
  socials: [],
  tiktok: '',
  instagram: '',
  babyStage: '',
  dueDate: '',
  consent: false, // never pre-checked, on every render path
}

interface SavedSession {
  step: Step
  /** Details she submitted — drives her stage and the record. */
  form: CommunityValues
  /** What is typed on the sign-up screen right now (may be unsubmitted). */
  draft: CommunityValues
  quantities: Quantities
  personalizationName: string
  submissionId: string | null
  /** Never displayed; proves later saves come from this phone. */
  writeKey: string | null
  result: Result | null
}

const isRelationship = (v: unknown): v is Relationship =>
  typeof v === 'string' && relationships.some((r) => r.value === v)

const isStage = (v: unknown): v is BabyStage =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(stagePlans, v)

/** Sessions saved before the TikTok / Instagram question simply have none ticked. */
function cleanSocials(socials: unknown, tiktok: unknown, instagram: unknown) {
  const picked = Array.isArray(socials) ? socials : []
  const has = (s: Social) => picked.includes(s)
  const none = has('none') && !has('tiktok') && !has('instagram')
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  return {
    socials: none ? (['none'] as Social[]) : (['tiktok', 'instagram'] as const).filter(has),
    tiktok: has('tiktok') ? str(tiktok) : '',
    instagram: has('instagram') ? str(instagram) : '',
  }
}

function cleanForm(raw: unknown): CommunityValues {
  if (!raw || typeof raw !== 'object') return EMPTY_FORM
  const f = raw as Partial<Record<keyof CommunityValues, unknown>>
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  return {
    name: str(f.name),
    relationship: isRelationship(f.relationship) ? f.relationship : '',
    relationshipOther: f.relationship === 'others' ? str(f.relationshipOther) : '',
    email: str(f.email),
    mobile: str(f.mobile),
    ...cleanSocials(f.socials, f.tiktok, f.instagram),
    // 'newborn' was merged into 'baby' (0 to 12 months).
    babyStage: f.babyStage === 'newborn' ? 'baby' : isStage(f.babyStage) ? f.babyStage : '',
    dueDate: str(f.dueDate),
    consent: f.consent === true,
  }
}

function writeHistory(mode: 'push' | 'replace', step: Step, sheet = false): void {
  const state = { ...(window.history.state ?? {}), step, sheet }
  if (mode === 'push') window.history.pushState(state, '')
  else window.history.replaceState(state, '')
}

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'instant' })

/** "carl" → "Carl" for the greeting. The saved record keeps what she typed. */
const capitalize = (s: string) => (s ? s.charAt(0).toLocaleUpperCase('en-PH') + s.slice(1) : s)

export default function Page() {
  const [hydrated, setHydrated] = useState(false)
  const [step, setStep] = useState<Step>('join')
  const [form, setForm] = useState<CommunityValues>(EMPTY_FORM)
  const [draft, setDraft] = useState<CommunityValues>(EMPTY_FORM)
  const [quantities, setQuantities] = useState<Quantities>({})
  const [personalizationName, setPersonalizationName] = useState('')
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [writeKey, setWriteKey] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const stepRef = useRef<Step>('join')
  const formRef = useRef<CommunityValues>(EMPTY_FORM)
  const joinedRef = useRef(false)
  const sheetOpenRef = useRef(false)
  const finishingRef = useRef(false)
  const progressTracker = useRef(makeProgressTracker())
  const unlockAnnounced = useRef(false)

  stepRef.current = step
  formRef.current = form
  joinedRef.current = submissionId !== null
  sheetOpenRef.current = sheetOpen

  const stage: BabyStage = form.babyStage || 'others'
  const basket = useMemo(() => computeBasket(quantities), [quantities])

  // "Almost there" looks in her Checklist first, then her stage's
  // "You might also like" list, before falling back to everything.
  const stagePools = useMemo(() => {
    const { picks, suggestions: extras } = stagePlans[stage]
    const resolve = (ids: string[]) => ids.map((id) => productById.get(id)).filter((p): p is Product => Boolean(p))
    return picks === 'all' ? { first: products, then: [] } : { first: resolve(picks), then: resolve(extras) }
  }, [stage])

  const suggestions = useMemo(
    () => suggestProducts(quantities, stagePools.first, 3, stagePools.then),
    [quantities, stagePools]
  )

  /* ---------------- navigation ---------------- */
  const goTo = useCallback((next: Step) => {
    writeHistory('push', next)
    setStep(next)
    scrollTop()
  }, [])

  /* ---------------- restore + Back button ---------------- */
  useEffect(() => {
    let initial: Step = 'join'
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SavedSession>
        const savedForm = cleanForm(saved.form)
        setForm(savedForm)
        setDraft(saved.draft ? cleanForm(saved.draft) : savedForm)
        setQuantities(sanitiseQuantities(saved.quantities))
        if (typeof saved.personalizationName === 'string') setPersonalizationName(saved.personalizationName)
        if (saved.step === 'done' && saved.result?.submission) {
          setResult(saved.result)
          setSubmissionId(saved.result.submission.submissionId)
          initial = 'done'
        // A session saved before "Are you…" or the write key existed goes
        // back to the sign-up, which gives it both.
        } else if (
          typeof saved.submissionId === 'string' &&
          typeof saved.writeKey === 'string' &&
          savedForm.babyStage &&
          savedForm.relationship
        ) {
          setSubmissionId(saved.submissionId)
          setWriteKey(saved.writeKey)
          joinedRef.current = true
          if (saved.step === 'checklist') initial = 'checklist'
        }
      }
    } catch {
      // Blocked storage — start clean.
    }
    setStep(initial)
    writeHistory('replace', initial)
    setHydrated(true)

    // Anything that failed to send earlier goes now, and again when the
    // connection comes back.
    flushPending()
    window.addEventListener('online', flushPending)
    // Also retry on a timer: 'online' only fires when the phone's own
    // network changes, not when the booth wifi or the server recovers.
    const retryTimer = window.setInterval(flushPending, 30000)

    const onPop = (e: PopStateEvent) => {
      const state = (e.state ?? {}) as { step?: Step; sheet?: boolean }

      // The confirmation is terminal and read-only: Back stays on it.
      if (stepRef.current === 'done') {
        writeHistory('push', 'done')
        return
      }
      // Never navigate away mid-finish.
      if (finishingRef.current) {
        writeHistory('push', stepRef.current, sheetOpenRef.current)
        return
      }
      // Back while the basket sheet is open just closes the sheet.
      if (sheetOpenRef.current && !state.sheet) {
        setSheetOpen(false)
        return
      }

      const target = state.step ?? 'join'
      const allowed: Step = target === 'checklist' && joinedRef.current ? 'checklist' : 'join'
      // Leaving the sign-up without submitting discards the unsaved edits.
      setDraft(formRef.current)
      setSheetOpen(allowed === 'checklist' && state.sheet === true)
      setStep(allowed)
      scrollTop()
    }
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('online', flushPending)
      window.clearInterval(retryTimer)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      const session: SavedSession = {
        step,
        form,
        draft,
        quantities,
        personalizationName,
        submissionId,
        writeKey,
        result: step === 'done' ? result : null,
      }
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch {
      /* storage unavailable — everything still works in memory */
    }
  }, [hydrated, step, form, draft, quantities, personalizationName, submissionId, writeKey, result])

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
    (id: string, key: string, event: Submission['event'], values: CommunityValues): Submission => {
      const bagName = tidy(personalizationName)
      return {
        submissionId: id,
        writeKey: key,
        timestamp: new Date().toISOString(),
        seq: nextSeq(),
        event,
        name: tidy(values.name),
        relationship: values.relationship || 'others',
        ...(values.relationship === 'others' && tidy(values.relationshipOther)
          ? { relationshipOther: tidy(values.relationshipOther) }
          : {}),
        email: values.email.trim(),
        mobile: normalisePhMobile(values.mobile) ?? values.mobile.trim(),
        ...socialsFor(values),
        babyStage: values.babyStage || 'others',
        ...(values.babyStage === 'expecting' && values.dueDate ? { dueDate: values.dueDate } : {}),
        marketingConsent: values.consent,
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
        ...(basket.unlocked && bagName && isPrintableBagName(bagName)
          ? { personalizationName: bagName }
          : {}),
      }
    },
    [basket, personalizationName]
  )

  /* ---------------- actions ---------------- */
  // Called only after CommunityForm's validation passes.
  const handleJoin = useCallback(() => {
    if (finishingRef.current) return
    const committed = draft
    const id = submissionId ?? newSubmissionId()
    const key = writeKey ?? newWriteKey()
    const firstTime = submissionId === null
    setForm(committed)
    setSubmissionId(id)
    setWriteKey(key)
    joinedRef.current = true
    // Save the lead now, so a mom who stops here is still captured. Not
    // awaited: slow booth wifi must never hold her on the form.
    void sendSubmission(buildSubmission(id, key, 'signup', committed))
    if (firstTime) {
      track('community_signup_completed', { stage: committed.babyStage })
      track('nesting_started', { stage: committed.babyStage })
    }
    goTo('checklist')
  }, [draft, submissionId, writeKey, buildSubmission, goTo])

  // Switch stage in place from the checklist. Her basket is untouched; the
  // lead record is re-sent (same id) so it carries the new stage.
  const changeStage = useCallback(
    (next: BabyStage) => {
      if (finishingRef.current || !submissionId || !writeKey || next === form.babyStage) return
      // Keep the due date even when she peeks at another stage: it is only
      // sent while the stage is Expecting (see buildSubmission), and she
      // shouldn't lose what she typed by switching back.
      const updated: CommunityValues = { ...form, babyStage: next }
      setForm(updated)
      setDraft(updated)
      void sendSubmission(buildSubmission(submissionId, writeKey, 'signup', updated))
      track('stage_changed', { from: form.babyStage, to: next })
    },
    [form, submissionId, writeKey, buildSubmission]
  )

  const changeQty = useCallback(
    (id: string, qty: number) => {
      if (finishingRef.current) return
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
    if (sheetOpenRef.current) return
    writeHistory('push', 'checklist', true)
    setSheetOpen(true)
    track('basket_opened', { units: basket.units, total: basket.total })
  }, [basket.units, basket.total])

  const closeBasket = useCallback(() => {
    if (finishingRef.current) return
    // Pop the sheet's own history entry; the popstate handler closes it.
    if ((window.history.state as { sheet?: boolean } | null)?.sheet) window.history.back()
    else setSheetOpen(false)
  }, [])

  const goToPersonalization = useCallback(() => {
    closeBasket()
    // Wait for the sheet to unmount and the scroll lock to lift.
    window.setTimeout(() => {
      const input = document.getElementById('personalization')
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      input?.focus({ preventScroll: true })
    }, 150)
  }, [closeBasket])

  const handleFinish = useCallback(async () => {
    if (finishingRef.current || basket.count === 0 || !submissionId || !writeKey) return
    // A bag name the vendor can't print: send her back to fix it first.
    if (basket.unlocked && personalizationName.trim() && !isPrintableBagName(personalizationName)) {
      goToPersonalization()
      return
    }
    finishingRef.current = true // synchronous — blocks the double-tap
    setFinishing(true)
    const submission = buildSubmission(submissionId, writeKey, 'checklist_completed', form)
    const storedRemotely = await sendSubmission(submission)
    track('form_submitted', { total: basket.total, units: basket.units, unlocked: basket.unlocked })
    finishingRef.current = false
    setFinishing(false)
    setResult({ submission, storedRemotely })
    setSheetOpen(false)
    goTo('done')
  }, [basket, submissionId, writeKey, personalizationName, buildSubmission, form, goTo, goToPersonalization])

  const handleStartOver = useCallback(() => {
    if (finishingRef.current) return
    if (stepRef.current !== 'done' && !window.confirm('Clear this session? The next guest starts fresh.')) {
      return
    }
    try {
      window.sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    setForm(EMPTY_FORM)
    setDraft(EMPTY_FORM)
    setQuantities({})
    setPersonalizationName('')
    setSubmissionId(null)
    setWriteKey(null)
    joinedRef.current = false
    setSheetOpen(false)
    setResult(null)
    unlockAnnounced.current = false
    progressTracker.current = makeProgressTracker()
    writeHistory('replace', 'join')
    setStep('join')
    scrollTop()
  }, [])

  /* ---------------- screens ---------------- */
  if (step === 'done' && result) {
    return (
      <>
        <NurseryBackdrop stage={result.submission.babyStage} />
        <Confirmation
          submission={result.submission}
          storedRemotely={result.storedRemotely}
          onStartOver={handleStartOver}
        />
      </>
    )
  }

  if (step === 'checklist' && submissionId) {
    return (
      <>
        {/* The room takes the colour of her baby stage and crossfades on Change. */}
        <NurseryBackdrop stage={stage} />
        <ChecklistPage
          firstName={capitalize(tidy(form.name).split(' ')[0]) || 'there'}
          stage={stage}
          quantities={quantities}
          basket={basket}
          suggestions={suggestions}
          personalizationName={personalizationName}
          onPersonalizationChange={setPersonalizationName}
          onChangeQty={changeQty}
          onChangeStage={changeStage}
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
          stage={stage}
        />
      </>
    )
  }

  return (
    <>
      {/* Neutral pastels until she picks a baby stage, then that stage's colours. */}
      <NurseryBackdrop stage={draft.babyStage} />
      <JoinPage
        values={draft}
        onChange={setDraft}
        onSubmit={handleJoin}
        submitting={false}
        returning={submissionId !== null}
      />
    </>
  )
}
