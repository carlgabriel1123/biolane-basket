import type { BabyStage, Relationship } from '../data/campaign.ts'

/** The sign-up details from the first screen. */
export interface LeadInfo {
  /** Full name, "First name Surname" — what the dashboard, CSV and sheet show. */
  name: string
  /** The two boxes on the form; missing on records from before the split. */
  firstName?: string
  lastName?: string
  /** "Are you…": dad, mom, grandparent, or others. */
  relationship: Relationship
  /** What she typed when relationship is 'others'. */
  relationshipOther?: string
  email: string
  /** Normalised to +639XXXXXXXXX. */
  mobile: string
  /** Bare lower-case usernames (no @), only for the apps she ticked. */
  tiktok?: string
  instagram?: string
  /** She ticked N/A: no TikTok or Instagram. */
  noSocials?: boolean
  babyStage: BabyStage
  dueDate?: string
  marketingConsent: boolean
}

/**
 * One record per mom. It is sent twice with the SAME submissionId:
 *   event 'signup'              — when she joins (screen 1)
 *   event 'checklist_completed' — when she finishes, with her basket
 * `seq` increases with every send, so the receiver can keep the latest
 * record per submissionId even if two requests arrive out of order.
 */
export interface Submission extends LeadInfo {
  submissionId: string
  /**
   * 32 hex chars, created with the claim code and never shown on screen.
   * The database only lets a later save replace a record if it carries the
   * same key, so seeing a claim code is not enough to overwrite it.
   */
  writeKey: string
  timestamp: string
  seq: number
  event: 'signup' | 'checklist_completed'
  selectedProducts: Array<{
    id: string
    name: string
    size: string
    gbfSku: string
    price: number
    qty: number
    lineTotal: number
  }>
  basketTotal: number
  rewardUnlocked: boolean
  personalizationName?: string
}

interface StoredSubmission extends Submission {
  /** True once the webhook has accepted this record. */
  synced: boolean
}

const STORAGE_KEY = 'biolane-nesting-submissions'

/**
 * Records go to this site's own server route (app/api/submit/route.ts),
 * which saves them to the Supabase table `submissions`. Every record is
 * also kept in localStorage on the phone, and any that failed to send are
 * re-sent on the next load and when the connection comes back.
 */
const SUBMIT_ENDPOINT = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/submit`

let seqCounter = 0
/** Next sequence number, unique within this phone even across reloads. */
export function nextSeq(): number {
  seqCounter = Math.max(seqCounter + 1, Date.now())
  return seqCounter
}

export function newWriteKey(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function newSubmissionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return 'BIO-' + crypto.randomUUID().slice(0, 8).toUpperCase()
  }
  return 'BIO-' + Math.abs(Date.now() % 100000000).toString(36).toUpperCase()
}

function readStore(): StoredSubmission[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeStore(all: StoredSubmission[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Private mode / blocked storage — sending is still attempted.
  }
}

/** Keeps the newest record per id; a completed checklist is never replaced by a sign-up. */
function stashLocally(submission: Submission): void {
  const all = readStore()
  const existing = all.find((s) => s.submissionId === submission.submissionId)
  if (existing && existing.event === 'checklist_completed' && submission.event === 'signup') return
  if (existing && existing.seq > submission.seq) return
  const rest = all.filter((s) => s.submissionId !== submission.submissionId)
  rest.push({ ...submission, synced: false })
  writeStore(rest)
}

/**
 * The database has it — delete the phone's copy. On a shared booth phone a
 * saved record is only a privacy risk (name, email, mobile, due date), so
 * only records still waiting to be sent are ever kept.
 */
function markSynced(id: string, seq: number): void {
  const remaining = readStore().filter((s) => !(s.submissionId === id && s.seq <= seq))
  if (remaining.length) writeStore(remaining)
  else {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
}

/** One-time clean-up of copies left behind by older versions of the site. */
function purgeSynced(): void {
  const all = readStore()
  const pending = all.filter((s) => !s.synced)
  if (pending.length === all.length) return
  if (pending.length) writeStore(pending)
  else {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
}

/**
 * saved    — the database has it.
 * retry    — temporary problem (offline, timeout, server busy, or the save
 *            endpoint missing on this host): keep it.
 * rejected — the server looked at this record and says it can never be
 *            saved (400 / 413 / 422); resending it forever would not help,
 *            so it is dropped.
 */
type Outcome = 'saved' | 'retry' | 'rejected'
const REJECTED_STATUSES = new Set([400, 413, 422])

async function post(submission: Submission): Promise<Outcome> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (res.ok) {
      markSynced(submission.submissionId, submission.seq)
      return 'saved'
    }
    if (REJECTED_STATUSES.has(res.status)) {
      console.warn('[submit] record rejected by the server', res.status, submission.submissionId)
      markSynced(submission.submissionId, submission.seq) // removes it
      return 'rejected'
    }
    return 'retry'
  } catch {
    // Offline / flaky booth wifi. The local copy means nothing is lost.
    return 'retry'
  }
}

// One request at a time, in order, so a sign-up can never overtake the
// finished checklist for the same mom.
let queue: Promise<unknown> = Promise.resolve()
// Records currently queued or being sent, so a retry never doubles up.
const inFlight = new Set<string>()
const flightKey = (s: { submissionId: string; seq: number }) => `${s.submissionId}:${s.seq}`

/** Saves locally, then POSTs. Resolves true only if the database accepted it. */
export function sendSubmission(submission: Submission): Promise<boolean> {
  stashLocally(submission)
  const key = flightKey(submission)
  inFlight.add(key)
  const job = queue.then(() => post(submission)).finally(() => inFlight.delete(key))
  queue = job.catch(() => undefined)
  return job.then((outcome) => outcome === 'saved')
}

/** Re-send every record the database has not accepted yet. */
export function flushPending(): void {
  purgeSynced()
  for (const rec of readStore().filter((s) => !s.synced)) {
    const key = flightKey(rec)
    if (inFlight.has(key)) continue
    inFlight.add(key)
    queue = queue
      .then(async () => {
        // Re-read: it may have been saved, replaced or dropped meanwhile.
        const current = readStore().find((s) => s.submissionId === rec.submissionId && s.seq === rec.seq)
        if (!current) return
        const { synced: _synced, ...submission } = current
        await post(submission)
      })
      .catch(() => undefined)
      .finally(() => inFlight.delete(key))
  }
}

/** Dev helper: read back everything captured on this device. */
export function getStashedSubmissions(): Submission[] {
  return readStore()
}
