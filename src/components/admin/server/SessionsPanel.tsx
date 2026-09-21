import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actuatorApi } from '@/lib/api/settings'
import { relativeTime } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Skeleton } from '@/components/ui/Skeleton'
import { Section } from '@/components/account/Section'

export function SessionsPanel() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['admin', 'sessions'], queryFn: () => actuatorApi.sessions() })

  const kick = useMutation({
    mutationFn: (id: string) => actuatorApi.deleteSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] }),
  })

  const sessions = [...(query.data?.sessions ?? [])].sort((a, b) => b.lastAccessedTime.localeCompare(a.lastAccessedTime))

  return (
    <Section title="Sessions">
      {query.isLoading && (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      )}
      {query.isError && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-danger">
            {query.error instanceof Error ? query.error.message : 'Could not load sessions.'}
          </p>
          <Button size="sm" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      )}
      {query.data && (
        <>
          {sessions.length === 0 ? (
            <p className="text-sm text-ink-3">No active sessions.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-3">
                    <th className="pb-2 pr-4 font-medium">Session</th>
                    <th className="pb-2 pr-4 font-medium">Created</th>
                    <th className="pb-2 pr-4 font-medium">Last active</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-t border-line">
                      <td className="py-2.5 pr-4 font-mono text-xs whitespace-nowrap text-ink-2" title={s.id}>
                        {s.id.length > 12 ? `${s.id.slice(0, 12)}…` : s.id}
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap text-ink-2">{relativeTime(s.creationTime)}</td>
                      <td className="py-2.5 pr-4 whitespace-nowrap text-ink-2">{relativeTime(s.lastAccessedTime)}</td>
                      <td className="py-2.5 pr-4">
                        {s.expired ? <Chip className="border-danger/40 text-danger">Expired</Chip> : <Chip>Active</Chip>}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button size="sm" variant="danger" onClick={() => kick.mutate(s.id)} disabled={kick.isPending}>
                          Kick
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-ink-3">Kicking a session signs that device out — the user has to log in again.</p>
          {kick.isError && (
            <p className="mt-2 text-sm text-danger">
              {kick.error instanceof Error ? kick.error.message : 'Could not kick the session.'}
            </p>
          )}
        </>
      )}
    </Section>
  )
}
