import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query'
import { Books } from '@phosphor-icons/react'
import { booksApi } from '@/lib/api/books'
import { librariesApi } from '@/lib/api/libraries'
import { seriesApi } from '@/lib/api/series'
import type { Page, SearchCondition } from '@/lib/api/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { BookCard } from '@/components/media/BookCard'
import { KeepReadingCard } from '@/components/media/KeepReadingCard'
import { SeriesCard } from '@/components/media/SeriesCard'
import { DashboardRow, dashboardCardWidth, type PagedRowQuery } from '@/components/dashboard/DashboardRow'

const PAGE_SIZE = 20

function usePagedRow<T>(queryKey: readonly unknown[], fetchPage: (page: number) => Promise<Page<T>>): PagedRowQuery<T> {
  const query = useInfiniteQuery<Page<T>, Error, InfiniteData<Page<T>, number>, readonly unknown[], number>({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    initialPageParam: 0,
  })
  return { ...query, items: query.data?.pages.flatMap((p) => p.content) ?? [] }
}

export function DashboardPage() {
  const { libraryId } = useParams()
  const navigate = useNavigate()
  const scope = libraryId ?? 'all'

  const librariesQuery = useQuery({ queryKey: ['libraries'], queryFn: librariesApi.list })
  const libraries = librariesQuery.data
  const library = libraryId ? libraries?.find((l) => l.id === libraryId) : undefined

  useEffect(() => {
    document.title = libraryId ? (library ? `${library.name} · kmrs` : 'kmrs') : 'Dashboard · kmrs'
  }, [libraryId, library])

  const booksTo = libraryId ? `/libraries/${libraryId}/books` : '/books'
  const seriesTo = libraryId ? `/libraries/${libraryId}/series` : '/series'
  const libParam = libraryId ? [libraryId] : undefined
  const libCondition: SearchCondition[] = libraryId ? [{ libraryId: { operator: 'is', value: libraryId } }] : []

  const keepReading = usePagedRow(['dashboard', 'keep-reading', scope], (page) =>
    booksApi.list({
      search: { condition: { allOf: [{ readStatus: { operator: 'is', value: 'IN_PROGRESS' } }, ...libCondition] } },
      page,
      size: PAGE_SIZE,
      sort: ['readProgress.readDate,desc'],
    }),
  )

  const onDeck = usePagedRow(['dashboard', 'on-deck', scope], (page) =>
    booksApi.ondeck({ libraryId: libParam, page, size: PAGE_SIZE }),
  )

  const releasedBooks = usePagedRow(['dashboard', 'recently-released-books', scope], (page) =>
    booksApi.list({
      search: { condition: { allOf: [{ releaseDate: { operator: 'isNotNull' } }, ...libCondition] } },
      page,
      size: PAGE_SIZE,
      sort: ['metadata.releaseDate,desc'],
    }),
  )

  const addedBooks = usePagedRow(['dashboard', 'recently-added-books', scope], (page) =>
    libraryId
      ? booksApi.list({
          search: { condition: { allOf: libCondition } },
          page,
          size: PAGE_SIZE,
          sort: ['createdDate,desc'],
        })
      : booksApi.latest({ page, size: PAGE_SIZE }),
  )

  const addedSeries = usePagedRow(['dashboard', 'recently-added-series', scope], (page) =>
    seriesApi.new({ libraryId: libParam, page, size: PAGE_SIZE }),
  )

  const updatedSeries = usePagedRow(['dashboard', 'recently-updated-series', scope], (page) =>
    seriesApi.updated({ libraryId: libParam, page, size: PAGE_SIZE }),
  )

  const readCondition: SearchCondition = {
    anyOf: [
      { readStatus: { operator: 'is', value: 'READ' } },
      { readStatus: { operator: 'is', value: 'IN_PROGRESS' } },
    ],
  }
  const recentlyRead = usePagedRow(['dashboard', 'recently-read', scope], (page) =>
    seriesApi.list({
      search: { condition: libraryId ? { allOf: [readCondition, ...libCondition] } : readCondition },
      page,
      size: PAGE_SIZE,
      sort: ['readDate,desc'],
    }),
  )

  const rows = [keepReading, onDeck, releasedBooks, addedBooks, addedSeries, updatedSeries, recentlyRead]
  const allEmpty = rows.every((q) => q.isSuccess && q.items.length === 0)

  return (
    <div>
      {libraryId ? (
        <PageHeader
          title={library?.name ?? (librariesQuery.isPending ? <Skeleton className="mt-1.5 h-8 w-48" /> : 'Recommended')}
        />
      ) : (
        <PageHeader
          title="Dashboard"
          actions={
            libraries && libraries.length > 1 ? (
              <SegmentedControl
                options={[{ value: 'all', label: 'All' }, ...libraries.map((l) => ({ value: l.id, label: l.name }))]}
                value="all"
                onChange={(v) => navigate(v === 'all' ? '/dashboard' : `/libraries/${v}/recommended`)}
              />
            ) : undefined
          }
        />
      )}

      {allEmpty ? (
        <EmptyState
          icon={<Books />}
          title="Nothing here yet"
          body="Books and series will appear here once your server has content."
        />
      ) : (
        <div className="space-y-10">
          <DashboardRow
            title="Keep Reading"
            to={booksTo}
            query={keepReading}
            keyOf={(b) => b.id}
            renderItem={(b) => <KeepReadingCard book={b} className="snap-start" />}
          />
          <DashboardRow
            title="On Deck"
            to={booksTo}
            query={onDeck}
            keyOf={(b) => b.id}
            renderItem={(b) => <BookCard book={b} showSeries className={dashboardCardWidth} />}
          />
          <DashboardRow
            title="Recently Released Books"
            to={booksTo}
            query={releasedBooks}
            keyOf={(b) => b.id}
            renderItem={(b) => <BookCard book={b} showSeries className={dashboardCardWidth} />}
          />
          <DashboardRow
            title="Recently Added Books"
            to={booksTo}
            query={addedBooks}
            keyOf={(b) => b.id}
            renderItem={(b) => <BookCard book={b} showSeries className={dashboardCardWidth} />}
          />
          <DashboardRow
            title="Recently Added Series"
            to={seriesTo}
            query={addedSeries}
            keyOf={(s) => s.id}
            renderItem={(s) => <SeriesCard series={s} className={dashboardCardWidth} />}
          />
          <DashboardRow
            title="Recently Updated Series"
            to={seriesTo}
            query={updatedSeries}
            keyOf={(s) => s.id}
            renderItem={(s) => <SeriesCard series={s} className={dashboardCardWidth} />}
          />
          <DashboardRow
            title="Recently Read"
            to={seriesTo}
            query={recentlyRead}
            keyOf={(s) => s.id}
            renderItem={(s) => <SeriesCard series={s} className={dashboardCardWidth} />}
          />
        </div>
      )}
    </div>
  )
}
