import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { CaretRight, CircleNotch, MagnifyingGlass, WarningCircle, X } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { booksApi } from '@/lib/api/books'
import { collectionsApi, readlistsApi } from '@/lib/api/collections'
import { seriesApi } from '@/lib/api/series'
import type { Page } from '@/lib/api/types'
import { densityScale, useUiStore } from '@/lib/store/ui'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { CardSkeleton, GridSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { BookCard } from '@/components/media/BookCard'
import { HorizontalRow } from '@/components/media/HorizontalRow'
import { MediaGrid } from '@/components/media/MediaGrid'
import { CollectionCard, ReadListCard, SeriesCard } from '@/components/media/SeriesCard'

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'series', label: 'Series' },
  { value: 'books', label: 'Books' },
  { value: 'collections', label: 'Collections' },
  { value: 'readlists', label: 'Read lists' },
] as const

type SearchTab = (typeof TABS)[number]['value']

function parseTab(raw: string | null): SearchTab {
  return TABS.some((t) => t.value === raw) ? (raw as SearchTab) : 'all'
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const qRaw = searchParams.get('q') ?? ''
  const q = qRaw.trim()
  const tab = parseTab(searchParams.get('tab'))

  const [input, setInput] = useState(qRaw)
  // last value this field pushed to the URL; divergence means the change came
  // from outside (top-bar search, back/forward) and must be synced back in
  const lastPushed = useRef(qRaw)

  useEffect(() => {
    if (qRaw !== lastPushed.current) {
      lastPushed.current = qRaw
      setInput(qRaw)
    }
  }, [qRaw])

  useEffect(() => {
    const v = input.trim()
    if (v === lastPushed.current.trim()) return
    const t = setTimeout(() => {
      lastPushed.current = v
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (v) next.set('q', v)
          else next.delete('q')
          return next
        },
        { replace: true },
      )
    }, 400)
    return () => clearTimeout(t)
  }, [input, setSearchParams])

  useEffect(() => {
    document.title = q ? `Search: ${q} · kmrs` : 'Search · kmrs'
  }, [q])

  const onTabChange = (value: SearchTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', value)
        return next
      },
      { replace: true },
    )
  }

  return (
    <div>
      <div className="relative mb-5 max-w-2xl">
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-ink-3" />
        <input
          type="search"
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search series, books, collections, read lists…"
          aria-label="Search"
          className="h-12 w-full rounded-lg border border-line bg-surface pr-11 pl-10 text-base text-ink transition-colors placeholder:text-ink-3 focus:border-accent/70 focus:outline-none"
        />
        {input && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setInput('')}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-ink-3 transition-colors hover:text-ink"
          >
            <X className="size-4.5" />
          </button>
        )}
      </div>

      <div className="mb-7 overflow-x-auto pb-1">
        <SegmentedControl<SearchTab> options={[...TABS]} value={tab} onChange={onTabChange} />
      </div>

      {!q ? (
        <EmptyState
          icon={<MagnifyingGlass />}
          title="Search your library"
          body="Find series, books, collections and read lists. Field queries like title:berserk AND tag:seinen work too."
        />
      ) : tab === 'all' ? (
        <AllResults q={q} />
      ) : tab === 'series' ? (
        <CategoryGrid
          q={q}
          queryKey={['series', 'search', q]}
          fetchPage={(page) => seriesApi.list({ search: { fullTextSearch: q }, page, size: 24 })}
          renderCard={(s) => <SeriesCard series={s} />}
        />
      ) : tab === 'books' ? (
        <CategoryGrid
          q={q}
          queryKey={['books', 'search', q]}
          fetchPage={(page) => booksApi.list({ search: { fullTextSearch: q }, page, size: 24 })}
          renderCard={(b) => <BookCard book={b} showSeries />}
        />
      ) : tab === 'collections' ? (
        <CategoryGrid
          q={q}
          queryKey={['collections', 'search', q]}
          fetchPage={(page) => collectionsApi.list({ search: q, page, size: 24 })}
          renderCard={(c) => <CollectionCard id={c.id} name={c.name} count={c.seriesIds.length} />}
        />
      ) : (
        <CategoryGrid
          q={q}
          queryKey={['readlists', 'search', q]}
          fetchPage={(page) => readlistsApi.list({ search: q, page, size: 24 })}
          renderCard={(r) => <ReadListCard id={r.id} name={r.name} count={r.bookIds.length} />}
        />
      )}
    </div>
  )
}

function AllResults({ q }: { q: string }) {
  const series = useQuery({
    queryKey: ['series', 'search', q, 'preview'],
    queryFn: () => seriesApi.list({ search: { fullTextSearch: q }, size: 8 }),
  })
  const books = useQuery({
    queryKey: ['books', 'search', q, 'preview'],
    queryFn: () => booksApi.list({ search: { fullTextSearch: q }, size: 8 }),
  })
  const collections = useQuery({
    queryKey: ['collections', 'search', q, 'preview'],
    queryFn: () => collectionsApi.list({ search: q, size: 8 }),
  })
  const readlists = useQuery({
    queryKey: ['readlists', 'search', q, 'preview'],
    queryFn: () => readlistsApi.list({ search: q, size: 8 }),
  })
  const queries = [series, books, collections, readlists]
  const reduce = useReducedMotion()

  if (queries.some((x) => x.isLoading)) return <PreviewSkeleton />

  const failed = queries.find((x) => x.isError)
  if (failed) {
    return <SearchError error={failed.error} onRetry={() => queries.forEach((x) => void x.refetch())} />
  }

  const total = queries.reduce((n, x) => n + (x.data?.totalElements ?? 0), 0)
  if (total === 0) return <NoResults q={q} />

  return (
    <motion.div
      className="space-y-9"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <PreviewRow title="Series" tab="series" q={q} page={series.data} renderCard={(s) => <SeriesCard series={s} />} />
      <PreviewRow title="Books" tab="books" q={q} page={books.data} renderCard={(b) => <BookCard book={b} showSeries />} />
      <PreviewRow
        title="Collections"
        tab="collections"
        q={q}
        page={collections.data}
        renderCard={(c) => <CollectionCard id={c.id} name={c.name} count={c.seriesIds.length} />}
      />
      <PreviewRow
        title="Read lists"
        tab="readlists"
        q={q}
        page={readlists.data}
        renderCard={(r) => <ReadListCard id={r.id} name={r.name} count={r.bookIds.length} />}
      />
    </motion.div>
  )
}

function PreviewRow<T extends { id: string }>({
  title,
  tab,
  q,
  page,
  renderCard,
}: {
  title: string
  tab: SearchTab
  q: string
  page?: Page<T>
  renderCard: (item: T) => ReactNode
}) {
  const density = useUiStore((s) => s.gridDensity)
  const width = Math.round(140 * densityScale(density))
  if (!page || page.totalElements === 0) return null
  return (
    <HorizontalRow title={`${title} · ${page.totalElements}`}>
      {page.content.map((item) => (
        <div key={item.id} className="shrink-0 snap-start" style={{ width }}>
          {renderCard(item)}
        </div>
      ))}
      <Link
        to={`/search?q=${encodeURIComponent(q)}&tab=${tab}`}
        style={{ width }}
        className="flex shrink-0 snap-start flex-col items-center justify-center gap-1.5 self-stretch rounded-lg border border-line text-[13px] font-medium text-ink-3 transition-colors hover:border-accent/50 hover:text-accent-strong"
      >
        View all
        <CaretRight className="size-4" />
      </Link>
    </HorizontalRow>
  )
}

function CategoryGrid<T extends { id: string }>({
  q,
  queryKey,
  fetchPage,
  renderCard,
}: {
  q: string
  queryKey: readonly unknown[]
  fetchPage: (page: number) => Promise<Page<T>>
  renderCard: (item: T) => ReactNode
}) {
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: ({ pageParam }) => fetchPage(pageParam),
      initialPageParam: 0,
      getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    })

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && hasNextPage && !isFetchingNextPage) void fetchNextPage()
      },
      { rootMargin: '800px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) return <GridSkeleton count={12} />
  if (isError) return <SearchError error={error} onRetry={() => void refetch()} />

  const items = data?.pages.flatMap((p) => p.content) ?? []
  if (items.length === 0) return <NoResults q={q} />

  return (
    <>
      <MediaGrid>
        {items.map((item) => (
          <Fragment key={item.id}>{renderCard(item)}</Fragment>
        ))}
      </MediaGrid>
      {isFetchingNextPage && (
        <div className="mt-8 flex justify-center text-ink-3">
          <CircleNotch className="size-5 animate-spin" />
        </div>
      )}
      <div ref={sentinelRef} className="h-1" />
    </>
  )
}

function NoResults({ q }: { q: string }) {
  return (
    <EmptyState
      icon={<MagnifyingGlass />}
      title={`No results for "${q}"`}
      body="Try different keywords, or search in a single category."
    />
  )
}

function SearchError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <EmptyState
      icon={<WarningCircle />}
      title="Search failed"
      body={error instanceof Error ? error.message : 'Something went wrong.'}
      action={<Button onClick={onRetry}>Try again</Button>}
    />
  )
}

function PreviewSkeleton() {
  return (
    <div className="space-y-9">
      {[0, 1].map((i) => (
        <div key={i}>
          <Skeleton className="mb-3 h-7 w-44" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }, (_, j) => (
              <CardSkeleton key={j} className="w-[140px] shrink-0" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
