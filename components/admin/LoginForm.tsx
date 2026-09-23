'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminPost, describeError } from './api'

const field =
  'mt-1 block w-full rounded-xl border-2 border-ink/15 bg-white px-3.5 py-3 text-[15px] text-ink outline-none focus:border-blue'

export default function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await adminPost('/api/admin/login', { username, password })
      router.refresh()
    } catch (err) {
      setError(describeError(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-card border border-ink/10 bg-white p-5 shadow-soft">
      <h1 className="font-display text-[22px] font-extrabold text-ink">Log in</h1>

      <label className="mt-5 block text-[13px] font-semibold text-ink">
        Username
        <input
          className={field}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </label>
      <label className="mt-4 block text-[13px] font-semibold text-ink">
        Password
        <input
          className={field}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      {error && (
        <p role="alert" className="mt-3 text-[13px] font-semibold text-[#b3261e]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 min-h-[48px] w-full rounded-full bg-blue px-6 text-[15px] font-bold text-white transition-colors hover:bg-blue-deep disabled:opacity-60"
      >
        {busy ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  )
}
