import { useQueries } from '@tanstack/react-query'
import { actuatorApi } from '@/lib/api/settings'
import { Section } from '@/components/account/Section'

const METRICS = [
  { name: 'komga.libraries', label: 'Libraries' },
  { name: 'komga.series', label: 'Series' },
  { name: 'komga.books', label: 'Books' },
  { name: 'komga.collections', label: 'Collections' },
  { name: 'komga.readlists', label: 'Read lists' },
] as const

export function ContentCounts() {
  const results = useQueries({
    queries: METRICS.map((m) => ({
      queryKey: ['admin', 'metric', m.name],
      queryFn: () => actuatorApi.metric(m.name),
      refetchInterval: 30_000,
    })),
  })

  return (
    <Section title="Content">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {METRICS.map((m, i) => {
          const q = results[i]
          const value = q.data?.measurements.find((x) => x.statistic === 'VALUE')?.value
          return (
            <div key={m.name}>
              <p className="text-2xl font-semibold text-ink">{q.isLoading ? '…' : (value ?? '—')}</p>
              <p className="mt-0.5 text-xs text-ink-3">{m.label}</p>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
