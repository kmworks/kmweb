import { keepPreviousData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { pageHashesApi } from '@/lib/api/pageHashes'
import type { PageHashAction, PageHashUnknownDto } from '@/lib/api/types'
import { plural } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Sentinel } from '@/components/filters/Sentinel'

function ReviewCard({ item }: { item: PageHashUnknownDto }) {
  const queryClient = useQueryClient()

  const act = useMutation({
    mutationFn: (action: PageHashAction) =>
      pageHashesApi.createOrUpdate({ hash: item.hash, size: item.size, action }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'page-hashes'] }),
  })

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div
        aria-hidden
        className="h-44 w-full bg-raised bg-cover bg-center"
        style={{ backgroundImage: `url(${pageHashesApi.unknownThumbnailUrl(item.hash, 400)})` }}
      />
      <div className="flex flex-col gap-2.5 p-3">
        <div className="min-w-0">
          <code className="block truncate font-mono text-xs text-ink-2" title={item.hash}>
            {item.hash}
          </code>
          <p className="mt-0.5 text-xs text-ink-3">{plural(item.matchCount, 'occurrence')}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Button size="sm" onClick={() => act.mutate('IGNORE')} disabled={act.isPending}>
            Ignore
          </Button>
          <Button size="sm" onClick={() => act.mutate('DELETE_MANUAL')} disabled={act.isPending}>
            Delete manual
          </Button>
          <Button size="sm" variant="danger" onClick={() => act.mutate('DELETE_AUTO')} disabled={act.isPending}>
            Delete auto
          </Button>
        </div>
        {act.isError && (
          <p className="text-[11px] text-danger">
            {act.error instanceof Error ? act.error.message : 'Could not save the action.'}
          </p>
        )}
      </div>
    </div>
  )
}

export function UnknownTab() {
  const q = useInfiniteQuery({
    queryKey: ['admin', 'page-hashes', 'unknown'],
    queryFn: ({ pageParam }) => pageHashesApi.listUnknown({ page: pageParam, size: 24 }),
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
  })

  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  const total = q.data?.pages[0]?.totalElements

  return (
    <div>
      <p className="mb-4 text-sm text-ink-3">
        {total !== undefined ? `${plural(total, 'hash')} waiting for review` : 'Hashes waiting for review'} · Delete
        auto also removes future occurrences during scans.
      </p>

      {q.isPending ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : q.isError ? (
        <EmptyState
          icon={<WarningCircle />}
          title="Couldn't load unknown hashes"
          body={q.error instanceof Error ? q.error.message : 'Something went wrong.'}
          action={<Button onClick={() => q.refetch()}>Retry</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CheckCircle />}
          title="Nothing to review"
          body="Every duplicated page hash has been triaged."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <ReviewCard key={item.hash} item={item} />
            ))}
          </div>
          <Sentinel
            active={!!q.hasNextPage && !q.isPlaceholderData}
            onIntersect={() => {
              if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage()
            }}
          />
          {q.isFetchingNextPage && <Skeleton className="mt-4 h-10 w-full" />}
        </>
      )}
    </div>
  )
}
