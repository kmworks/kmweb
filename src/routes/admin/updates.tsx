import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowSquareOut, GitCommit, Rocket, Tag, WarningCircle } from '@phosphor-icons/react'
import { releasesApi } from '@/lib/api/releases'
import { serverApi } from '@/lib/api/users'
import type { ReleaseDto } from '@/lib/api/types'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { MarkdownContent } from '@/components/ui/Markdown'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'

function Badge({ children, tone }: { children: string; tone: 'current' | 'pre' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        tone === 'current' ? 'border-accent/40 bg-accent-soft text-accent-strong' : 'border-line bg-raised text-ink-2',
      )}
    >
      {children}
    </span>
  )
}

function ReleaseCard({ release, isCurrent }: { release: ReleaseDto; isCurrent: boolean }) {
  return (
    <article className={cn('rounded-xl border bg-surface p-5', isCurrent ? 'border-accent/40' : 'border-line')}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <Tag className="size-4 text-ink-3" />
          {release.version}
        </h2>
        {isCurrent && <Badge tone="current">Current</Badge>}
        {release.preRelease && <Badge tone="pre">Pre-release</Badge>}
        <time className="text-xs text-ink-3" dateTime={release.releaseDate} title={new Date(release.releaseDate).toLocaleString()}>
          {formatDate(release.releaseDate)}
        </time>
        <a
          href={release.url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs text-ink-3 hover:text-accent-strong"
        >
          <ArrowSquareOut className="size-3.5" />
          GitHub
        </a>
      </header>
      {release.description && <MarkdownContent markdown={release.description} className="mt-3" />}
    </article>
  )
}

export function AdminUpdatesPage() {
  const infoQuery = useQuery({ queryKey: ['server-info'], queryFn: serverApi.info, staleTime: Infinity })
  const q = useQuery({ queryKey: ['admin', 'releases'], queryFn: releasesApi.list })

  useEffect(() => {
    document.title = 'Updates · KMReader'
  }, [])

  const currentVersion = infoQuery.data?.build?.version
  const commit = infoQuery.data?.git?.commit?.id
  const releases = q.data ?? []
  // the current release floats to the top, the rest keeps server order (newest first)
  const sorted = [...releases].sort((a, b) => Number(b.version === currentVersion) - Number(a.version === currentVersion))

  return (
    <div className="max-w-3xl">
      <PageHeader title="Updates" subtitle="Server version and upstream releases" />

      <section className="mb-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-xs font-medium tracking-wide text-ink-3 uppercase">Running version</h2>
        {infoQuery.isPending ? (
          <Skeleton className="mt-3 h-7 w-40" />
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-xl font-semibold text-ink">{currentVersion ?? 'unknown'}</span>
            {commit && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-3">
                <GitCommit className="size-3.5" />
                {commit.slice(0, 8)}
              </span>
            )}
            {q.data && currentVersion && !releases.some((r) => r.version === currentVersion) && (
              <Chip className="px-2 py-0.5 text-[11px]">not in release feed</Chip>
            )}
          </div>
        )}
      </section>

      {q.isPending ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : q.isError ? (
        <EmptyState
          icon={<WarningCircle />}
          title="Couldn't load releases"
          body={q.error instanceof Error ? q.error.message : 'Something went wrong.'}
          action={<Button onClick={() => q.refetch()}>Retry</Button>}
        />
      ) : sorted.length === 0 ? (
        <EmptyState icon={<Rocket />} title="No releases found" body="The release feed returned nothing." />
      ) : (
        <div className="flex flex-col gap-4">
          {sorted.map((r) => (
            <ReleaseCard key={r.version} release={r} isCurrent={r.version === currentVersion} />
          ))}
        </div>
      )}
    </div>
  )
}
