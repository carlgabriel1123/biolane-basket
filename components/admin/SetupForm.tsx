'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyIcon, UserIcon } from '@/components/icons'
import { Button, Card } from '@/components/ui'
import { adminPost, describeError } from './api'
import { FormError, PasswordField, TextField } from './fields'

/** Shown once: creates the single admin account. */
export default function SetupForm() {
  const router = useRouter()
  const [setupCode, setSetupCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('The two passwords do not match.')
    setBusy(true)
    try {
      await adminPost('/api/admin/setup', { setupCode, username, password })
      router.refresh()
    } catch (err) {
      setError(describeError(err))
      setBusy(false)
    }
  }

  return (
    <Card className="p-5">
      <form onSubmit={submit}>
        <h1 className="font-display text-[22px] font-extrabold text-ink">Create the admin login</h1>
        <p className="mt-1 text-[13.5px] leading-snug text-ink-soft">
          One shared login for the Biolane team. This page appears only once; keep the password somewhere safe.
        </p>

        <TextField
          className="mt-5"
          label={
            <>
              Setup code <span className="font-normal text-ink-soft">(from the site owner)</span>
            </>
          }
          icon={<KeyIcon size={18} />}
          value={setupCode}
          onChange={(e) => setSetupCode(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
        <TextField
          className="mt-4"
          label="Username"
          icon={<UserIcon size={18} />}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          minLength={3}
          maxLength={40}
        />
        <PasswordField
          className="mt-4"
          label={
            <>
              Password <span className="font-normal text-ink-soft">(at least 10 characters)</span>
            </>
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={10}
        />
        <PasswordField
          className="mt-4"
          label="Repeat password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          minLength={10}
        />

        {error && <FormError className="mt-3">{error}</FormError>}

        <Button type="submit" size="lg" full loading={busy} className="mt-5">
          {busy ? 'Creating…' : 'Create login'}
        </Button>
      </form>
    </Card>
  )
}
