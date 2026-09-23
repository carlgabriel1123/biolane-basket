'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminSubmission } from '@/lib/admin-db'
import { asset } from '@/lib/asset'
import { peso } from '@/lib/format'
import { adminGet, adminPost, describeError } from './api'

interface Props {
  username: string
  sheetConfigured: boolean
}

type Filter = 'all' | 'unpaid' | 'paid' | 'gift' | 'finished' | 'signup' | 'expecting' | 'baby' | 'toddler' | 'others'

const FILTERS: Array<[Filter, string]> = [
  ['all', 'All'],
  ['unpaid', 'Unpaid'],
  ['paid', 'Paid'],
  ['gift', 'Gift unlocked'],
  ['finished', 'Finished'],
  ['signup', 'Signed up only'],
  ['expecting', 'Expecting'],
  ['baby', 'Baby'],
  ['toddler', 'Toddler'],
  ['others', 'Others'],
]

const STAGE: Record<string, string> = { expecting: 'Expecting', baby: 'Baby 0–12 mo', toddler: 'Toddler 1–4 yr', others: 'Others' }
const REL: Record<string, string> = { dad: 'Dad', mom: 'Mom', grandparent: 'Grandparent', others: 'Others' }

const POLL_MS = 30_000
const OVERLAP_MS = 5_000

const timeFmt = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' })
const when = (iso: string | null) => (iso ? timeFmt.format(new Date(iso)) : '')

export default function Dashboard({ username, sheetConfigured }: Props) {
  const router = useRouter()
  const [rows, setRows] = useState<Map<string, AdminSubmission>>(new Map())
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const lastServerTime = useRef<string | null>(null)

  const merge = useCallback((incoming: AdminSubmission[]) => {
    if (incoming.length === 0) return
    setRows((prev) => {
      const next = new Map(prev)
      for (const r of incoming) {
        const cur = next.get(r.submission_id)
        if (!cur || cur.updated_at <= r.updated_at) next.set(r.submission_id, r)
      }
      return next
    })
  }, [])

  const load = useCallback(async () => {
    try {
      const since = lastServerTime.current
        ? new Date(new Date(lastServerTime.current).getTime() - OVERLAP_MS).toISOString()
        : null
      const data = await adminGet<{ rows: AdminSubmission[]; serverTime: string }>(
        `/api/admin/submissions${since ? `?since=${encodeURIComponent(since)}` : ''}`
      )
      lastServerTime.current = data.serverTime
      merge(data.rows)
      setLoaded(true)
      setLoadError('')
    } catch (err) {
      const e = err as { error?: string }
      if (e?.error === 'not-logged-in') {
        router.refresh()
        return
      }
      setLoadError(describeError(err))
    }
  }, [merge, router])

  useEffect(() => {
    void load()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  const all = useMemo(
    () => [...rows.values()].sort((a, b) => (a.received_at < b.received_at ? 1 : a.received_at > b.received_at ? -1 : 0)),
    [rows]
  )

  const today = dayFmt.format(new Date())
  const counts = useMemo(
    () => ({
      today: all.filter((r) => dayFmt.format(new Date(r.received_at)) === today).length,
      total: all.length,
      finished: all.filter((r) => r.event === 'checklist_completed').length,
      gift: all.filter((r) => r.reward_unlocked).length,
      paid: all.filter((r) => r.paid_at).length,
    }),
    [all, today]
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    // Mobiles are stored as +639XXXXXXXXX; let staff type 0917…, 917… or 63917….
    const digits = q.replace(/\D/g, '').replace(/^(0|63)?(9\d*)$/, '$2')
    return all.filter((r) => {
      if (filter === 'unpaid' && r.paid_at) return false
      if (filter === 'paid' && !r.paid_at) return false
      if (filter === 'gift' && !r.reward_unlocked) return false
      if (filter === 'finished' && r.event !== 'checklist_completed') return false
      if (filter === 'signup' && r.event !== 'signup') return false
      if (['expecting', 'baby', 'toddler', 'others'].includes(filter) && r.baby_stage !== filter) return false
      if (!q) return true
      return (
        r.submission_id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (digits.length >= 3 && r.mobile.replace(/\D/g, '').includes(digits)) ||
        (r.personalization_name ?? '').toLowerCase().includes(q)
      )
    })
  }, [all, query, filter])

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 4000)
  }

  // Replace a row outright (the server's answer always wins over an
  // optimistic guess, whatever the phone's clock says).
  const setRow = useCallback((row: AdminSubmission) => {
    setRows((prev) => new Map(prev).set(row.submission_id, row))
  }, [])

  const togglePaid = async (r: AdminSubmission) => {
    const paid = !r.paid_at
    if (!paid && !window.confirm(`Mark ${r.submission_id} (${r.name}) as NOT paid?`)) return
    setBusyId(r.submission_id)
    // Optimistic: flip now, put it back if the server says no.
    setRow({ ...r, paid_at: paid ? new Date().toISOString() : null })
    try {
      const data = await adminPost<{ row: AdminSubmission; sheet: string | null }>('/api/admin/paid', { id: r.submission_id, paid })
      setRow(data.row)
      if (sheetConfigured && data.sheet) flash('Saved here. The Google Sheet did not update — use "Sync sheet" later.')
    } catch (err) {
      // Put the row back, then ask the server what it really has: a slow
      // request may have timed out here after the database applied it.
      setRow(r)
      flash(describeError(err))
      void load()
    } finally {
      setBusyId(null)
    }
  }

  const syncSheet = async () => {
    setSyncing(true)
    try {
      const data = await adminPost<{ attempted: number; synced: number; error: string | null }>('/api/admin/sync', {})
      flash(data.attempted === 0 ? 'The sheet is already up to date.' : `Sent ${data.synced} of ${data.attempted} rows to the sheet.`)
      void load()
    } catch (err) {
      const e = err as { error?: string }
      flash(e?.error === 'not-configured' ? 'Google Sheet is not connected yet.' : `Sheet sync failed: ${e?.error ?? 'unknown'}`)
    } finally {
      setSyncing(false)
    }
  }

  const logout = async () => {
    try {
      await adminPost('/api/admin/logout', {})
    } finally {
      router.refresh()
    }
  }

  const toggleOpen = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-4 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src={asset('/images/brand/biolane-logo.png')} alt="Biolane" width={547} height={159} priority className="h-auto w-[120px]" />
          <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Admin</span>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-ink-soft">
          <span className="hidden sm:inline">{username}</span>
          <button type="button" onClick={() => setShowPassword((v) => !v)} className="min-h-[40px] rounded-full px-3 font-semibold text-blue hover:bg-white">
            Change password
          </button>
          <button type="button" onClick={logout} className="min-h-[40px] rounded-full border border-ink/15 bg-white px-3 font-semibold text-ink hover:border-blue hover:text-blue">
            Log out
          </button>
        </div>
      </header>

      {showPassword && <PasswordForm onDone={() => setShowPassword(false)} onNotice={flash} />}

      {/* Counts */}
      <section aria-label="Totals" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          ['Today', counts.today],
          ['Sign-ups', counts.total],
          ['Finished', counts.finished],
          ['Gift unlocked', counts.gift],
          ['Paid', counts.paid],
        ].map(([label, n]) => (
          <div key={label} className="rounded-card border border-ink/10 bg-white px-3 py-2.5 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft/75">{label}</p>
            <p className="font-display text-[24px] font-extrabold leading-tight tabular-nums text-ink">{n}</p>
          </div>
        ))}
      </section>

      {/* Toolbar */}
      <section className="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search claim code, name, mobile or email"
          aria-label="Search sign-ups"
          className="min-h-[44px] w-full rounded-full border-2 border-ink/15 bg-white px-4 text-[14px] text-ink outline-none focus:border-blue md:flex-1"
        />
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            aria-label="Filter"
            className="min-h-[44px] flex-1 rounded-full border-2 border-ink/15 bg-white px-3 text-[14px] font-semibold text-ink outline-none focus:border-blue"
          >
            {FILTERS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <a
            href="/api/admin/export"
            className="inline-flex min-h-[44px] items-center rounded-full border-2 border-blue px-4 text-[13.5px] font-bold text-blue hover:bg-blue hover:text-white"
          >
            Download CSV
          </a>
          <button
            type="button"
            onClick={syncSheet}
            disabled={syncing}
            title={sheetConfigured ? 'Send rows the Google Sheet is missing' : 'Google Sheet not connected yet'}
            className="inline-flex min-h-[44px] items-center rounded-full border-2 border-ink/15 bg-white px-4 text-[13.5px] font-bold text-ink hover:border-blue hover:text-blue disabled:opacity-60"
          >
            {syncing ? 'Syncing…' : 'Sync sheet'}
          </button>
        </div>
      </section>

      <p className="mt-2 text-[12px] text-ink-soft" aria-live="polite">
        {notice || (loadError ? loadError : loaded ? `${visible.length} of ${all.length} shown · refreshes every 30 s · times are Manila` : 'Loading…')}
      </p>

      {/* Rows */}
      <ul className="mt-3 flex flex-col gap-2.5">
        {visible.map((r) => {
          const paid = Boolean(r.paid_at)
          const finished = r.event === 'checklist_completed'
          const isOpen = open.has(r.submission_id)
          const unsynced = sheetConfigured && (!r.sheet_synced_at || r.sheet_synced_at < r.updated_at)
          return (
            <li
              key={r.submission_id}
              className={`rounded-card border bg-white p-3.5 shadow-soft md:grid md:grid-cols-[150px_minmax(0,1fr)_170px_150px] md:items-start md:gap-4 ${
                paid ? 'border-[#2e7d32]/40' : 'border-ink/10'
              }`}
            >
              <div>
                <p className="font-mono text-[15px] font-extrabold tracking-wide text-ink">{r.submission_id}</p>
                <p className="text-[12px] text-ink-soft">{when(r.received_at)}</p>
                <p className="mt-1 flex flex-wrap gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${finished ? 'bg-blue text-white' : 'bg-sky text-ink'}`}>
                    {finished ? 'Finished' : 'Signed up'}
                  </span>
                  {r.reward_unlocked && <span className="rounded-full bg-cream px-2 py-0.5 text-[11px] font-bold text-gold">🎁 Gift</span>}
                  {unsynced && <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink-soft" title="Not in the Google Sheet yet">Sheet pending</span>}
                </p>
              </div>

              <div className="mt-2 min-w-0 md:mt-0">
                <p className="text-[15px] font-bold text-ink">
                  {r.name} <span className="font-normal text-ink-soft">· {REL[r.relationship] ?? r.relationship}{r.relationship_other ? ` (${r.relationship_other})` : ''}</span>
                </p>
                <p className="text-[13px] text-ink-soft">
                  <a href={`tel:${r.mobile}`} className="font-semibold text-blue">{r.mobile}</a> · {r.email}
                </p>
                <p className="text-[13px] text-ink-soft">
                  {STAGE[r.baby_stage] ?? r.baby_stage}
                  {r.due_date ? ` · due ${r.due_date}` : ''}
                  {r.marketing_consent ? ' · consent ✓' : ' · no marketing'}
                  {r.personalization_name ? ` · bag: ${r.personalization_name}` : ''}
                </p>
                {r.selected_products.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleOpen(r.submission_id)}
                    aria-expanded={isOpen}
                    className="mt-1 min-h-[36px] text-[13px] font-semibold text-blue underline underline-offset-4"
                  >
                    {isOpen ? 'Hide products' : `${r.selected_products.length} product${r.selected_products.length === 1 ? '' : 's'}`}
                  </button>
                )}
                {isOpen && (
                  <ul className="mt-1 rounded-xl bg-sky-soft px-3 py-2 text-[13px] text-ink">
                    {r.selected_products.map((p) => (
                      <li key={p.id} className="flex justify-between gap-3 py-0.5">
                        <span>
                          {p.name}
                          {p.size ? ` ${p.size}` : ''} × {p.qty}
                          <span className="text-ink-soft"> · SKU {p.gbfSku}</span>
                        </span>
                        <span className="tabular-nums">{peso(p.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-2 md:mt-0 md:text-right">
                <p className="font-display text-[20px] font-extrabold tabular-nums text-ink">{peso(r.basket_total)}</p>
                <p className="text-[12px] text-ink-soft">{finished ? 'basket total' : 'no basket yet'}</p>
              </div>

              <div className="mt-3 md:mt-0">
                <button
                  type="button"
                  onClick={() => togglePaid(r)}
                  disabled={busyId === r.submission_id}
                  aria-pressed={paid}
                  className={`min-h-[44px] w-full rounded-full px-4 text-[14px] font-bold transition-colors disabled:opacity-60 ${
                    paid ? 'bg-[#2e7d32] text-white hover:bg-[#256628]' : 'border-2 border-ink/20 bg-white text-ink hover:border-[#2e7d32] hover:text-[#2e7d32]'
                  }`}
                >
                  {paid ? '✓ Paid' : 'Mark paid'}
                </button>
                {paid && <p className="mt-1 text-center text-[11.5px] text-ink-soft md:text-right">{when(r.paid_at)}</p>}
              </div>
            </li>
          )
        })}
      </ul>

      {loaded && visible.length === 0 && (
        <p className="mt-6 text-center text-[14px] text-ink-soft">{all.length === 0 ? 'No sign-ups yet.' : 'Nothing matches that search.'}</p>
      )}
    </main>
  )
}

function PasswordForm({ onDone, onNotice }: { onDone: () => void; onNotice: (m: string) => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const field = 'mt-1 block w-full rounded-xl border-2 border-ink/15 bg-white px-3 py-2.5 text-[14px] text-ink outline-none focus:border-blue'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (next !== confirm) return setError('The two new passwords do not match.')
    setBusy(true)
    try {
      await adminPost('/api/admin/password', { current, next })
      onNotice('Password changed. Other devices are logged out.')
      onDone()
    } catch (err) {
      setError(describeError(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 grid gap-3 rounded-card border border-ink/10 bg-white p-4 shadow-soft sm:grid-cols-3 sm:items-end">
      <label className="block text-[12.5px] font-semibold text-ink">
        Current password
        <input className={field} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
      </label>
      <label className="block text-[12.5px] font-semibold text-ink">
        New password (10+ characters)
        <input className={field} type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required minLength={10} />
      </label>
      <label className="block text-[12.5px] font-semibold text-ink">
        Repeat new password
        <input className={field} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required minLength={10} />
      </label>
      {error && (
        <p role="alert" className="text-[13px] font-semibold text-[#b3261e] sm:col-span-3">
          {error}
        </p>
      )}
      <div className="flex gap-2 sm:col-span-3">
        <button type="submit" disabled={busy} className="min-h-[42px] rounded-full bg-blue px-5 text-[14px] font-bold text-white hover:bg-blue-deep disabled:opacity-60">
          {busy ? 'Saving…' : 'Save new password'}
        </button>
        <button type="button" onClick={onDone} className="min-h-[42px] rounded-full px-4 text-[14px] font-semibold text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  )
}
