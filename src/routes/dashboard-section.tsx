import { Fragment, useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Books, WarningCircle } from '@phosphor-icons/react'
import { plural } from '@/lib/utils/format'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { GridSkeleton } from '@/components/ui/Skeleton'
import { MediaGrid } from '@/components/media/MediaGrid'
import { Sentinel } from '@/components/filters/Sentinel'
import { DASHBOARD_SECTIONS, type DashboardSectionKey } from '@/components/dashboard/sections'

export function DashboardSectionPage() {
  const { libraryId, sectionKey = '' } = useParams()
  const section = Object.hasOwn(DASHBOARD_SECTIONS, sectionKey)
    ? DASHBOARD_SECTIONS[sectionKey as DashboardSectionKey]
    : undefined
  const homeTo = libraryId ? `/libraries/${libraryId}/recommended` : '/dashboard'

  useEffect(() => {
    document.title = section ? `${section.title} · KMReader` : 'KMReader'
  }, [section])

  // same key+queryFn as the dashboard row, so the first pages come straight from cache
  const query = useInfiniteQuery({
    enabled: !!section,
    queryKey: ['dashboard', sectionKey, libraryId ?? 'all'],
    queryFn: ({ pageParam }) => {
      if (!section) throw new Error(`unknown dashboard section: ${sectionKey}`)
      return section.fetchPage(libraryId, pageParam)
    },
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    initialPageParam: 0,
  })

  if (!section) return <Navigate to={homeTo} replace />

  const items = query.data?.pages.flatMap((p) => p.content) ?? []
  const total = query.data?.pages[0]?.totalElements

  return (
    <div>
      <BackButton to={homeTo} className="mb-2 -ml-2" />
      <PageHeader
        title={section.title}
        subtitle={total != null ? (section.kind === 'book' ? plural(total, 'book') : plural(total, 'series', 'series')) : undefined}
      />
      {query.isPending ? (
        <GridSkeleton count={18} />
      ) : query.isError ? (
        <EmptyState
          icon={<WarningCircle />}
          title="Couldn't load"
          body={query.error.message}
          action={<Button onClick={() => query.refetch()}>Retry</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={<Books />} title="Nothing here yet" />
      ) : (
        <>
          <MediaGrid>
            {items.map((item) => (
              <Fragment key={item.id}>{section.renderGrid(item)}</Fragment>
            ))}
          </MediaGrid>
          <Sentinel
            active={!!query.hasNextPage}
            onIntersect={() => {
              if (!query.isFetchingNextPage) void query.fetchNextPage()
            }}
          />
        </>
      )}
    </div>
  )
}
