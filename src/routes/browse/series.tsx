import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Books, WarningCircle } from '@phosphor-icons/react'
import { librariesApi } from '@/lib/api/libraries'
import { seriesApi } from '@/lib/api/series'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSkeleton, GridSkeleton } from '@/components/ui/Skeleton'
import { MediaGrid } from '@/components/media/MediaGrid'
import { SeriesCard } from '@/components/media/SeriesCard'
import { FilterBar } from '@/components/filters/FilterBar'
import { FilterDrawer } from '@/components/filters/FilterDrawer'
import { Sentinel } from '@/components/filters/Sentinel'
import { activeFilterCount, serializeFilters, useBrowseFilters } from '@/components/filters/filterUrl'
import { serializeSort, useSortState } from '@/components/filters/sort'
import { buildSeriesSearch } from '@/components/filters/builders'
import { SERIES_DEFAULT_SORT, SERIES_FILTER_GROUPS, SERIES_SORT_OPTIONS } from '@/components/filters/types'

export function BrowseSeriesPage() {
  const { libraryId } = useParams()
  const { data: libraries } = useQuery({ queryKey: ['libraries'], queryFn: librariesApi.list })
  const library = libraries?.find((l) => l.id === libraryId)
  const title = libraryId ? (library?.name ?? 'Library') : 'All series'

  useEffect(() => {
    document.title = `${title} · kmrs`
  }, [title])

  const filters = useBrowseFilters()
  const sort = useSortState(`series:${libraryId ?? 'all'}`, SERIES_DEFAULT_SORT)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const search = useMemo(() => buildSeriesSearch(filters.state, libraryId), [filters.state, libraryId])
  const sortParam = serializeSort(sort.current)

  const q = useInfiniteQuery({
    queryKey: ['series', 'list', libraryId ?? 'all', serializeFilters(filters.state), sortParam],
    queryFn: ({ pageParam }) => seriesApi.list({ search, page: pageParam, size: 50, sort: [sortParam] }),
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
  })

  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  const total = q.data?.pages[0]?.totalElements
  const { hasNextPage, isFetchingNextPage, isPlaceholderData, fetchNextPage } = q
  const loadMore = useCallback(() => {
    // isPlaceholderData means a stale query is shown while filters changed; don't page the old one
    if (hasNextPage && !isFetchingNextPage && !isPlaceholderData) void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, isPlaceholderData, fetchNextPage])

  return (
    <div>
      <PageHeader title={title} />
      <FilterBar
        count={total}
        noun="series"
        groups={SERIES_FILTER_GROUPS}
        state={filters.state}
        activeCount={activeFilterCount(filters.state)}
        onToggleValue={filters.toggleValue}
        onToggleAuthor={filters.toggleAuthor}
        onClearQ={() => filters.setQ('')}
        onOpenFilters={() => setDrawerOpen(true)}
        sortOptions={SERIES_SORT_OPTIONS}
        sort={sort.current}
        onSortChange={sort.set}
      />
      {q.isPending ? (
        <GridSkeleton count={18} />
      ) : q.isError ? (
        <EmptyState
          icon={<WarningCircle />}
          title="Couldn't load series"
          body={q.error?.message || 'Something went wrong.'}
          action={<Button onClick={() => q.refetch()}>Retry</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={<Books />} title="No series found" body="Try adjusting your filters." />
      ) : (
        <>
          <MediaGrid>
            {items.map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </MediaGrid>
          {isFetchingNextPage && (
            <MediaGrid className="mt-7">
              {Array.from({ length: 4 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </MediaGrid>
          )}
          <Sentinel active={!!hasNextPage && !isPlaceholderData} onIntersect={loadMore} />
        </>
      )}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        groups={SERIES_FILTER_GROUPS}
        state={filters.state}
        libraryId={libraryId}
        activeCount={activeFilterCount(filters.state)}
        onToggleValue={filters.toggleValue}
        onToggleAuthor={filters.toggleAuthor}
        onSetMode={filters.setMode}
        onClearAll={filters.clearAll}
      />
    </div>
  )
}
