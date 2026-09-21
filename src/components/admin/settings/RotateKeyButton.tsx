import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Key, WarningCircle } from '@phosphor-icons/react'
import { settingsApi } from '@/lib/api/settings'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'

export function RotateKeyButton() {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)

  const mutation = useMutation({
    mutationFn: () => settingsApi.update({ renewRememberMeKey: true }),
    onSuccess: () => {
      setOpen(false)
      setDone(true)
    },
  })

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {done && <span className="text-xs text-accent-strong">Key rotated — all "Remember me" logins were signed out.</span>}
        <Button
          size="sm"
          onClick={() => {
            setDone(false)
            setOpen(true)
          }}
        >
          <Key className="size-4" />
          Rotate remember-me key
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen} title="Rotate remember-me key" size="sm">
        <div className="flex flex-col gap-4 p-5">
          <p className="flex items-start gap-2 text-sm text-ink-2">
            <WarningCircle className="mt-0.5 size-4 shrink-0 text-danger" />
            Every user who chose "Remember me" will be signed out and has to log in again on all devices.
          </p>
          {mutation.isError && (
            <p className="text-sm text-danger">
              {mutation.error instanceof Error ? mutation.error.message : 'Could not rotate the key.'}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={mutation.isPending} onClick={() => mutation.mutate()}>
              Rotate key
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
