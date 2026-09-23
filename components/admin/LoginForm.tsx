'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserIcon } from '@/components/icons'
import { Button, Card } from '@/components/ui'
import { adminPost, describeError } from './api'
import { FormError, PasswordField, TextField } from './fields'

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
    <Card className="p-5">
      <form onSubmit={submit}>
        <h1 className="font-display text-[22px] font-extrabold text-ink">Log in</h1>

        <TextField
          className="mt-5"
          label="Username"
          icon={<UserIcon size={18} />}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
        <PasswordField
          className="mt-4"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <FormError className="mt-3">{error}</FormError>}

        <Button type="submit" size="lg" full loading={busy} className="mt-5">
          {busy ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </Card>
  )
}
