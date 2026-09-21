import { useState, type FormEvent } from 'react'
import { usersApi } from '@/lib/api/users'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { Section } from './Section'

export function PasswordSection() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updated, setUpdated] = useState(false)

  const mismatch = confirm.length > 0 && password !== confirm

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!password || password !== confirm) return
    setBusy(true)
    setError(null)
    setUpdated(false)
    try {
      await usersApi.updatePassword(password)
      setPassword('')
      setConfirm('')
      setUpdated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title="Change password">
      <form onSubmit={submit} className="flex max-w-sm flex-col gap-4">
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helper="You will stay signed in on this device."
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch ? 'Passwords do not match.' : undefined}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        {updated && <p className="text-sm text-accent-strong">Password updated. Other sessions were signed out.</p>}
        <div>
          <Button type="submit" variant="primary" loading={busy} disabled={!password || password !== confirm}>
            Update password
          </Button>
        </div>
      </form>
    </Section>
  )
}
