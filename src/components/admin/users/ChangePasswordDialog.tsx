import { useEffect, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { usersApi } from '@/lib/api/users'
import type { UserDto } from '@/lib/api/types'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'

export function ChangePasswordDialog({ user, onOpenChange }: { user: UserDto | null; onOpenChange: (open: boolean) => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  useEffect(() => {
    if (user) {
      setPassword('')
      setConfirm('')
    }
  }, [user])

  const mutation = useMutation({
    mutationFn: ({ id, password: pw }: { id: string; password: string }) => usersApi.updatePasswordFor(id, pw),
    onSuccess: () => onOpenChange(false),
  })

  const close = () => {
    mutation.reset()
    onOpenChange(false)
  }

  const mismatch = confirm.length > 0 && password !== confirm

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!user || !password || password !== confirm) return
    mutation.mutate({ id: user.id, password })
  }

  return (
    <Dialog
      open={!!user}
      onOpenChange={(o) => {
        if (!o) close()
      }}
      title="Change password"
      size="sm"
    >
      <form onSubmit={submit} className="flex flex-col gap-4 px-5 py-4">
        <p className="text-sm text-ink-3">
          Set a new password for <span className="text-ink">{user?.email}</span>. All of their sessions will be signed
          out.
        </p>
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        {mutation.isError && (
          <p className="text-sm text-danger">
            {mutation.error instanceof Error ? mutation.error.message : 'Could not update the password.'}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={mutation.isPending} disabled={!password || password !== confirm}>
            Update password
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
