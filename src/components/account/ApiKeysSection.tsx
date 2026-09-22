import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowsClockwise, Check, Copy, Trash, WarningCircle } from '@phosphor-icons/react'
import { syncpointsApi } from '@/lib/api/syncpoints'
import { usersApi } from '@/lib/api/users'
import type { ApiKeyDto } from '@/lib/api/types'
import { formatDate, relativeTime } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { IconButton } from '@/components/ui/IconButton'
import { Skeleton } from '@/components/ui/Skeleton'
import { TextField } from '@/components/ui/TextField'
import { Section } from './Section'

type ResyncTarget = { kind: 'key'; key: ApiKeyDto } | { kind: 'all' }

export function ApiKeysSection() {
  const queryClient = useQueryClient()
  const keysQuery = useQuery({ queryKey: ['account', 'api-keys'], queryFn: usersApi.apiKeys })
  const activityQuery = useQuery({
    // distinct key from ActivitySection's paged query: different page size, different data
    queryKey: ['account', 'activity', 'api-key-usage'],
    queryFn: () => usersApi.authenticationActivity({ page: 0, size: 100 }),
  })
  const [comment, setComment] = useState('')
  const [created, setCreated] = useState<ApiKeyDto | null>(null)
  const [copied, setCopied] = useState(false)
  const [resyncTarget, setResyncTarget] = useState<ResyncTarget | null>(null)
  const [resyncDone, setResyncDone] = useState<string | null>(null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['account', 'api-keys'] })

  // most recent successful sign-in per API key, for the "Last used" line
  const lastUsedByKey = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of activityQuery.data?.content ?? []) {
      if (!a.apiKeyId || !a.success) continue
      const prev = map.get(a.apiKeyId)
      if (!prev || a.dateTime > prev) map.set(a.apiKeyId, a.dateTime)
    }
    return map
  }, [activityQuery.data])

  const createMutation = useMutation({
    mutationFn: (c: string) => usersApi.createApiKey(c),
    onSuccess: (key) => {
      setComment('')
      setCopied(false)
      setCreated(key)
      void invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteApiKey(id),
    onSuccess: invalidate,
  })

  const resyncMutation = useMutation({
    mutationFn: (target: ResyncTarget) =>
      target.kind === 'key' ? syncpointsApi.deleteMine([target.key.id]) : syncpointsApi.deleteMine(),
    onSuccess: (_data, target) => {
      setResyncTarget(null)
      setResyncDone(target.kind === 'key' ? (target.key.comment || 'Untitled') : 'all devices')
      window.setTimeout(() => setResyncDone(null), 4000)
    },
  })

  const copy = async () => {
    if (!created?.key) return
    try {
      await navigator.clipboard.writeText(created.key)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard needs a secure context; the key text stays manually selectable
    }
  }

  return (
    <Section title="API keys">
      {keysQuery.isLoading && (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
        </div>
      )}
      {keysQuery.isError && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-danger">
            {keysQuery.error instanceof Error ? keysQuery.error.message : 'Could not load API keys.'}
          </p>
          <Button size="sm" onClick={() => void keysQuery.refetch()}>
            Try again
          </Button>
        </div>
      )}
      {keysQuery.data && (
        <>
          {keysQuery.data.length > 0 && (
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="text-xs text-ink-3">Resync forces KOReader and Kobo devices to fetch everything again.</p>
              <Button size="sm" onClick={() => setResyncTarget({ kind: 'all' })}>
                <ArrowsClockwise className="size-4" />
                Resync all devices
              </Button>
            </div>
          )}
          <ul className="flex flex-col divide-y divide-line">
            {keysQuery.data.map((k) => (
              <li key={k.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{k.comment || 'Untitled'}</p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    Created {formatDate(k.createdDate)}
                    {lastUsedByKey.has(k.id) && ` · Last used ${relativeTime(lastUsedByKey.get(k.id))}`}
                  </p>
                </div>
                <IconButton
                  label={`Force resync for ${k.comment || 'Untitled'}`}
                  onClick={() => setResyncTarget({ kind: 'key', key: k })}
                >
                  <ArrowsClockwise className="size-4" />
                </IconButton>
                <IconButton
                  label="Delete API key"
                  onClick={() => deleteMutation.mutate(k.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash className="size-4" />
                </IconButton>
              </li>
            ))}
            {keysQuery.data.length === 0 && <li className="py-1 text-sm text-ink-3">No API keys yet.</li>}
          </ul>
        </>
      )}
      {deleteMutation.isError && (
        <p className="mt-2 text-sm text-danger">
          {deleteMutation.error instanceof Error ? deleteMutation.error.message : 'Could not delete API key.'}
        </p>
      )}
      {resyncDone && <p className="mt-2 text-sm text-accent-strong">Resync requested for {resyncDone}.</p>}

      <form
        className="mt-4 flex items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          const c = comment.trim()
          if (c) createMutation.mutate(c)
        }}
      >
        <TextField
          label="New API key"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comment, e.g. KOReader on Boox"
          className="flex-1"
        />
        <Button type="submit" variant="primary" loading={createMutation.isPending} disabled={!comment.trim()}>
          Create
        </Button>
      </form>
      {createMutation.isError && (
        <p className="mt-2 text-sm text-danger">
          {createMutation.error instanceof Error ? createMutation.error.message : 'Could not create API key.'}
        </p>
      )}

      <Dialog open={!!created} onOpenChange={(open) => !open && setCreated(null)} title="API key created" size="sm">
        <div className="flex flex-col gap-4 p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-danger">
            <WarningCircle className="size-4 shrink-0" />
            This key is shown only once.
          </p>
          <code className="rounded-lg border border-line bg-raised p-3 font-mono text-[13px] break-all text-ink select-all">
            {created?.key}
          </code>
          <div className="flex justify-end">
            <Button onClick={() => void copy()}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!resyncTarget}
        onOpenChange={(open) => {
          if (!open) {
            resyncMutation.reset()
            setResyncTarget(null)
          }
        }}
        title="Force resync"
        size="sm"
      >
        <div className="px-5 py-4">
          <p className="text-sm text-ink-2">
            {resyncTarget?.kind === 'key' ? (
              <>
                Reset the sync point for <span className="font-medium text-ink">{resyncTarget.key.comment || 'Untitled'}</span>?
                The next KOReader or Kobo device using this key downloads its whole progress again.
              </>
            ) : (
              'Reset the sync points of every API key? All your KOReader and Kobo devices download their whole progress again on the next sync.'
            )}
          </p>
          {resyncMutation.isError && (
            <p className="mt-3 text-sm text-danger">
              {resyncMutation.error instanceof Error ? resyncMutation.error.message : 'Could not request the resync.'}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <Button
            variant="ghost"
            onClick={() => {
              resyncMutation.reset()
              setResyncTarget(null)
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={resyncMutation.isPending}
            onClick={() => resyncTarget && resyncMutation.mutate(resyncTarget)}
          >
            Force resync
          </Button>
        </div>
      </Dialog>
    </Section>
  )
}
