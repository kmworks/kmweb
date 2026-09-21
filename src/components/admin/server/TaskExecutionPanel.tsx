import { useQueries } from '@tanstack/react-query'
import { actuatorApi } from '@/lib/api/settings'
import type { MetricDto } from '@/lib/api/types'
import { plural } from '@/lib/utils/format'
import { Skeleton } from '@/components/ui/Skeleton'
import { Section } from '@/components/account/Section'
import { formatDuration, taskTypeLabel } from './format'
import { metricStat, useMetric } from './useMetric'

interface Row {
  label: string
  count: number
  total: number
  max: number
}

function toRow(label: string, metric: MetricDto): Row {
  return {
    label,
    count: metricStat(metric, 'COUNT') ?? 0,
    total: metricStat(metric, 'TOTAL_TIME') ?? 0,
    max: metricStat(metric, 'MAX') ?? 0,
  }
}

export function TaskExecutionPanel() {
  const base = useMetric('komga.tasks.execution')
  const failure = useMetric('komga.tasks.failure')
  const types = base.data?.availableTags.find((t) => t.tag === 'type')?.values ?? []
  const perType = useQueries({
    queries: types.map((t) => ({
      queryKey: ['admin', 'metric', 'komga.tasks.execution', `type:${t}`],
      queryFn: () => actuatorApi.metric('komga.tasks.execution', [`type:${t}`]),
      // a type without executions yet 404s
      retry: false,
      refetchInterval: 30_000,
    })),
  })

  const typedRows = types.flatMap((t, i) => {
    const m = perType[i]?.data
    return m && (metricStat(m, 'COUNT') ?? 0) > 0 ? [toRow(taskTypeLabel(t), m)] : []
  })

  const aggregate = base.data && (metricStat(base.data, 'COUNT') ?? 0) > 0 ? toRow('All tasks', base.data) : null
  const rows = typedRows.length > 0 ? typedRows : aggregate ? [aggregate] : []
  const failureCount = metricStat(failure.data, 'COUNT') ?? 0

  return (
    <Section title="Task execution">
      {base.isLoading && (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-2/3" />
        </div>
      )}
      {!base.isLoading && rows.length === 0 && <p className="text-sm text-ink-3">No task executions recorded yet.</p>}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-3">
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 pr-4 text-right font-medium">Runs</th>
                <th className="pb-2 pr-4 text-right font-medium">Total time</th>
                <th className="pb-2 text-right font-medium">Longest</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-line">
                  <td className="py-2 pr-4 whitespace-nowrap text-ink-2">{r.label}</td>
                  <td className="py-2 pr-4 text-right font-mono text-xs text-ink">{r.count}</td>
                  <td className="py-2 pr-4 text-right whitespace-nowrap text-ink-2">{formatDuration(r.total)}</td>
                  <td className="py-2 text-right whitespace-nowrap text-ink-2">{formatDuration(r.max)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {failureCount > 0 && <p className="mt-3 text-xs text-danger">{plural(failureCount, 'task failure')} recorded.</p>}
    </Section>
  )
}
