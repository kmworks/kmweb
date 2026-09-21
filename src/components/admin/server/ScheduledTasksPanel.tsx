import { useQuery } from '@tanstack/react-query'
import { actuatorApi } from '@/lib/api/settings'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Skeleton } from '@/components/ui/Skeleton'
import { Section } from '@/components/account/Section'
import { formatInterval, targetLabel } from './format'

export function ScheduledTasksPanel() {
  const query = useQuery({ queryKey: ['admin', 'scheduled-tasks'], queryFn: actuatorApi.scheduledTasks })

  return (
    <Section title="Scheduled tasks">
      {query.isLoading && (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-2/3" />
        </div>
      )}
      {query.isError && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-danger">
            {query.error instanceof Error ? query.error.message : 'Could not load scheduled tasks.'}
          </p>
          <Button size="sm" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      )}
      {query.data && (
        <>
          {query.data.fixedRate.length === 0 ? (
            <p className="text-sm text-ink-3">No scheduled tasks.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {query.data.fixedRate.map((t) => (
                <li key={t.runnable.target} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="truncate font-mono text-[13px] text-ink-2" title={t.runnable.target}>
                    {targetLabel(t.runnable.target)}
                  </span>
                  <Chip className="shrink-0">{formatInterval(t.interval)}</Chip>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Section>
  )
}
