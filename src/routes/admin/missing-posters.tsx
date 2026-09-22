import { useEffect, useState } from 'react'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { ImageBroken, WarningCircle } from '@phosphor-icons/react'
import { booksApi } from '@/lib/api/books'
import type { BookSearch, SearchCondition } from '@/lib/api/types'
import { plural } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSkeleton, GridSkeleton } from '@/components/ui/Skeleton'
import { MediaGrid } from '@/components/media/MediaGrid'
import { BookCard } from '@/components/media/BookCard'
import { LibraryFilterMenu } from '@/components/admin/LibraryFilterMenu'
import { Sentinel } from '@/components/filters/Sentinel'

function searchFor(libraryId: string | null): BookSearch {
  const conditions: SearchCondition[] = [
    { deleted: { operator: 'isFalse' } },
    // no poster is marked selected: the book falls back to a generated cover
    { poster: { operator: 'isNot', value: { selected: true } } },
  ]
  if (libraryId) conditions.unshift({ libraryId: { operator: 'is', value: libraryId } })
  return { condition: { allOf: conditions } }
}

export function AdminMissingPostersPage() {
  const [libraryId, setLibraryId] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Missing posters · KMReader'
  }, [])

  const q = useInfiniteQuery({
    queryKey: ['admin', 'missing-posters', libraryId ?? 'all'],
    queryFn: ({ pageParam }) =>
      booksApi.list({ search: searchFor(libraryId), page: pageParam, size: 50, sort: ['series,asc'] }),
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
  })

  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  const total = q.data?.pages[0]?.totalElements

  return (
    <div>
      <PageHeader
        title="Missing posters"
        subtitle="Books without a selected poster. Open a book and use Manage posters to pick or upload one."
        actions={<LibraryFilterMenu value={libraryId} onChange={setLibraryId} />}
      />

      {q.isPending ? (
        <GridSkeleton count={18} />
      ) : q.isError ? (
        <EmptyState
          icon={<WarningCircle />}
          title="Couldn't load books"
          body={q.error instanceof Error ? q.error.message : 'Something went wrong.'}
          action={<Button onClick={() => q.refetch()}>Retry</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ImageBroken />}
          title="Every book has a poster"
          body="All books in this scope have a selected poster."
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-3">{plural(total ?? items.length, 'book')}</p>
          <MediaGrid>
            {items.map((b) => (
              <BookCard key={b.id} book={b} showSeries />
            ))}
          </MediaGrid>
          {q.isFetchingNextPage && (
            <MediaGrid className="mt-7">
              {Array.from({ length: 4 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </MediaGrid>
          )}
          <Sentinel
            active={!!q.hasNextPage && !q.isPlaceholderData}
            onIntersect={() => {
              if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage()
            }}
          />
        </>
      )}
    </div>
  )
}
