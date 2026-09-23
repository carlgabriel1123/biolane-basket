import type { BabyStage } from '../data/campaign.ts'

/** The sign-up details from the first screen. */
export interface LeadInfo {
  name: string
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
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ TO CONNECT A REAL BACKEND                                        │
 * │                                                                  │
 * │ This site is a static export on GitHub Pages, so there is no     │
 * │ server of its own. Point it at a webhook that accepts JSON:      │
 * │   • Google Sheets  — an Apps Script "web app" URL                │
 * │   • n8n / Make / Zapier — a webhook trigger                      │
 * │   • Airtable / Supabase — via one of the above, or an edge fn    │
 * │ Upsert on submissionId, keeping the record with the highest seq. │
 * │                                                                  │
 * │ For the live site: add a repository secret named                 │
 * │   NEXT_PUBLIC_SUBMIT_WEBHOOK_URL                                 │
 * │ (Settings → Secrets and variables → Actions). deploy.yml already │
 * │ passes it to the build. For local runs put the same line in      │
 * │ .env.local.                                                      │
 * │                                                                  │
 * │ Every record is also kept in localStorage on the phone, and any  │
 * │ that failed to send are re-sent when the connection returns.     │
 * └──────────────────────────────────────────────────────────────────┘
 */
const WEBHOOK_URL = process.env.NEXT_PUBLIC_SUBMIT_WEBHOOK_URL ?? ''

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

function markSynced(id: string, seq: number): void {
  const all = readStore()
  const rec = all.find((s) => s.submissionId === id && s.seq === seq)
  if (!rec) return
  rec.synced = true
  writeStore(all)
}

async function post(submission: Submission): Promise<boolean> {
  if (!WEBHOOK_URL) return false
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      // text/plain avoids a CORS preflight, which Apps Script web apps
      // cannot answer. The body is still JSON.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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

/** Saves locally, then POSTs. Resolves true only if the webhook accepted it. */
export function sendSubmission(submission: Submission): Promise<boolean> {
  stashLocally(submission)
  const job = queue.then(() => post(submission))
  queue = job.catch(() => undefined)
  return job
}

/** Re-send every record the webhook has not accepted yet. */
export function flushPending(): void {
  if (!WEBHOOK_URL) return
  for (const rec of readStore().filter((s) => !s.synced)) {
    const { synced: _synced, ...submission } = rec
    queue = queue.then(() => post(submission)).catch(() => undefined)
  }
}

/** Dev helper: read back everything captured on this device. */
export function getStashedSubmissions(): Submission[] {
  return readStore()
}
