import { useQuery } from '@tanstack/react-query'
import { actuatorApi } from '@/lib/api/settings'
import type { MetricDto } from '@/lib/api/types'

/** A metric with no recordings yet (e.g. komga.series on an empty library) 404s — callers render "—". */
export function useMetric(name: string) {
  return useQuery({
    queryKey: ['admin', 'metric', name],
    queryFn: () => actuatorApi.metric(name),
    refetchInterval: 30_000,
  })
}

export function metricStat(metric: MetricDto | undefined, statistic: string): number | undefined {
  return metric?.measurements.find((m) => m.statistic === statistic)?.value
}
