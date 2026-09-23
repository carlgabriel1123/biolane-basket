import type { BabyStage, Relationship } from '../data/campaign.ts'

/** The sign-up details from the first screen. */
export interface LeadInfo {
  name: string
  /** "Are you…": dad, mom, grandparent, or others. */
  relationship: Relationship
  /** What she typed when relationship is 'others'. */
  relationshipOther?: string
  email: string
  /** Normalised to +639XXXXXXXXX. */
  mobile: string
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

async function post(submission: Submission): Promise<boolean> {
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
    if (res.ok) markSynced(submission.submissionId, submission.seq)
    return res.ok
  } catch {
    // Offline / flaky booth wifi. The local copy means nothing is lost.
    return false
  }
}

// One request at a time, in order, so a sign-up can never overtake the
// finished checklist for the same mom.
let queue: Promise<unknown> = Promise.resolve()

/** Saves locally, then POSTs. Resolves true only if the database accepted it. */
export function sendSubmission(submission: Submission): Promise<boolean> {
  stashLocally(submission)
  const job = queue.then(() => post(submission))
  queue = job.catch(() => undefined)
  return job
}

/** Re-send every record the database has not accepted yet. */
export function flushPending(): void {
  purgeSynced()
  for (const rec of readStore().filter((s) => !s.synced)) {
    const { synced: _synced, ...submission } = rec
    queue = queue.then(() => post(submission)).catch(() => undefined)
  }
}

/** Dev helper: read back everything captured on this device. */
export function getStashedSubmissions(): Submission[] {
  return readStore()
}
