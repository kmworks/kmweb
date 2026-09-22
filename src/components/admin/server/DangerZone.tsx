import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FileArrowDown, Power, WarningCircle } from '@phosphor-icons/react'
import { actuatorApi } from '@/lib/api/settings'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'

export function DangerZone() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [shuttingDown, setShuttingDown] = useState(false)

  const shutdown = useMutation({
    mutationFn: actuatorApi.shutdown,
    onSuccess: () => {
      setConfirmOpen(false)
      setShuttingDown(true)
    },
  })

  if (shuttingDown)
    return (
      <section className="rounded-xl border border-danger/40 bg-danger/5 p-5">
        <h2 className="text-[15px] font-semibold text-danger">Server is shutting down</h2>
        <p className="mt-2 text-sm text-ink-2">
          The shutdown request was accepted. This page will stop responding once the process exits. Start the server
          again to come back.
        </p>
      </section>
    )

  return (
    <section className="rounded-xl border border-danger/40 bg-surface p-5">
      <h2 className="mb-4 text-[15px] font-semibold text-danger">Danger zone</h2>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 py-3 first:pt-0">
        <div className="min-w-0 max-w-md">
          <p className="text-sm text-ink-2">Download logfile</p>
          <p className="mt-0.5 text-xs text-ink-3">Fetch the current server log as a file.</p>
        </div>
        <a
          href={actuatorApi.logfileUrl()}
          download
          className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line bg-raised px-3 text-[13px] whitespace-nowrap text-ink transition-all duration-150 hover:border-line-strong hover:bg-overlay active:scale-[0.98]"
        >
          <FileArrowDown className="size-4" />
          Download
        </a>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 py-3 last:pb-0">
        <div className="min-w-0 max-w-md">
          <p className="text-sm text-ink-2">Shutdown server</p>
          <p className="mt-0.5 text-xs text-ink-3">Stop the server process. It stays down until someone starts it again.</p>
        </div>
        <Button size="sm" variant="danger" onClick={() => setConfirmOpen(true)}>
          <Power className="size-4" />
          Shutdown
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Shutdown server" size="sm">
        <div className="flex flex-col gap-4 p-5">
          <p className="flex items-start gap-2 text-sm text-ink-2">
            <WarningCircle className="mt-0.5 size-4 shrink-0 text-danger" />
            The server process will exit. Every connected user loses access until it is started again.
          </p>
          {shutdown.isError && (
            <p className="text-sm text-danger">
              {shutdown.error instanceof Error ? shutdown.error.message : 'Could not shut down the server.'}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={shutdown.isPending} onClick={() => shutdown.mutate()}>
              Shutdown
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  )
}
