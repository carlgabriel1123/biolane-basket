import 'server-only'

/**
 * Typed wrappers around the admin database functions — server only.
 * Every call carries ADMIN_TOKEN; the database refuses anything else and
 * the public can neither read nor write the submissions table directly.
 */

export interface AdminSubmission {
  submission_id: string
  event: 'signup' | 'checklist_completed'
  submitted_at: string
  received_at: string
  updated_at: string
  name: string
  relationship: string
  relationship_other: string | null
  email: string
  mobile: string
  baby_stage: string
  due_date: string | null
  marketing_consent: boolean
  selected_products: Array<{ id: string; name: string; size: string; gbfSku: string; price: number; qty: number; lineTotal: number }>
  basket_total: number
  reward_unlocked: boolean
  personalization_name: string | null
  paid_at: string | null
  sheet_synced_at: string | null
}

export interface AdminUser {
  username: string
  password_hash: string
  password_changed_at: string
}

export class DbError extends Error {
  readonly status: number
  readonly detail: string
  constructor(status: number, detail: string) {
    super(`database ${status}: ${detail}`)
    this.status = status
    this.detail = detail
  }
}

function env() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
  const token = process.env.ADMIN_TOKEN
  if (!url || !key || !token) return null
  return { url, key, token }
}

export function adminDbConfigured(): boolean {
  return env() !== null
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const cfg = env()
  if (!cfg) throw new DbError(503, 'not-configured')
  const res = await fetch(`${cfg.url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: cfg.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: cfg.token, ...args }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new DbError(res.status, (await res.text()).slice(0, 300))
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export const adminDb = {
  userCount: () => rpc<number>('admin_user_count', {}),

  getUser: async (username: string) => {
    const rows = await rpc<AdminUser[]>('admin_get_user', { p_username: username })
    return rows[0] ?? null
  },

  /** Returns password_changed_at. Throws DbError 409 if a user already exists. */
  createUser: (username: string, hash: string) =>
    rpc<string>('admin_create_user', { p_username: username, p_hash: hash }),

  setPassword: (username: string, hash: string) =>
    rpc<string>('admin_set_password', { p_username: username, p_hash: hash }),

  throttle: async (key: string, action: 'check' | 'fail' | 'reset') => {
    const rows = await rpc<Array<{ allowed: boolean; locked_until: string | null }>>('admin_throttle', {
      p_key: key,
      p_action: action,
    })
    return rows[0] ?? { allowed: true, locked_until: null }
  },

  listSubmissions: (since: string | null) =>
    rpc<AdminSubmission[]>('admin_list_submissions', { p_since: since }),

  setPaid: async (id: string, paid: boolean) => {
    const rows = await rpc<AdminSubmission[]>('admin_set_paid', { p_id: id, p_paid: paid })
    return rows[0] ?? null
  },

  markSynced: (id: string, updatedAt: string) =>
    rpc<boolean>('admin_mark_synced', { p_id: id, p_updated_at: updatedAt }),

  unsynced: (limit: number) => rpc<AdminSubmission[]>('admin_unsynced', { p_limit: limit }),
}
