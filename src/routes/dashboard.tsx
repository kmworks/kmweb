import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query'
import { Books } from '@phosphor-icons/react'
import { librariesApi } from '@/lib/api/libraries'
import type { BookDto, Page, SeriesDto } from '@/lib/api/types'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState } from '@/components/ui/EmptyState'
import { DashboardRow, type PagedRowQuery } from '@/components/dashboard/DashboardRow'
import { DASHBOARD_SECTIONS, type DashboardSectionKey } from '@/components/dashboard/sections'

function usePagedRow<T>(queryKey: readonly unknown[], fetchPage: (page: number) => Promise<Page<T>>): PagedRowQuery<T> {
  const query = useInfiniteQuery<Page<T>, Error, InfiniteData<Page<T>, number>, readonly unknown[], number>({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    initialPageParam: 0,
  })
  return { ...query, items: query.data?.pages.flatMap((p) => p.content) ?? [] }
}

function useSectionRow(key: DashboardSectionKey, libraryId: string | undefined, scope: string) {
  return usePagedRow(['dashboard', key, scope], (page) => DASHBOARD_SECTIONS[key].fetchPage(libraryId, page))
}

export function DashboardPage() {
  const { libraryId } = useParams()
  const navigate = useNavigate()
  const scope = libraryId ?? 'all'

  const librariesQuery = useQuery({ queryKey: ['libraries'], queryFn: librariesApi.list })
  const libraries = librariesQuery.data
  const library = libraryId ? libraries?.find((l) => l.id === libraryId) : undefined

  useEffect(() => {
    document.title = libraryId ? (library ? `${library.name} · KMReader` : 'KMReader') : 'Dashboard · KMReader'
  }, [libraryId, library])

  const rows: { key: DashboardSectionKey; query: PagedRowQuery<BookDto | SeriesDto> }[] = [
    { key: 'keep-reading', query: useSectionRow('keep-reading', libraryId, scope) },
    { key: 'on-deck', query: useSectionRow('on-deck', libraryId, scope) },
    { key: 'recently-released-books', query: useSectionRow('recently-released-books', libraryId, scope) },
    { key: 'recently-added-books', query: useSectionRow('recently-added-books', libraryId, scope) },
    { key: 'recently-added-series', query: useSectionRow('recently-added-series', libraryId, scope) },
    { key: 'recently-updated-series', query: useSectionRow('recently-updated-series', libraryId, scope) },
    { key: 'recently-read', query: useSectionRow('recently-read', libraryId, scope) },
  ]
  const allEmpty = rows.every((r) => r.query.isSuccess && r.query.items.length === 0)

  const librarySwitcher =
    libraries && libraries.length > 1 ? (
      <SegmentedControl
        options={[{ value: 'all', label: 'All' }, ...libraries.map((l) => ({ value: l.id, label: l.name }))]}
        value={scope}
        onChange={(v) => navigate(v === 'all' ? '/dashboard' : `/libraries/${v}/recommended`)}
      />
    ) : undefined

  return (
    <div>
      {librarySwitcher && <div className="mb-6 flex overflow-x-auto">{librarySwitcher}</div>}

      {allEmpty ? (
        <EmptyState
          icon={<Books />}
          title="Nothing here yet"
          body="Books and series will appear here once your server has content."
        />
      ) : (
        <div className="space-y-10">
          {rows.map(({ key, query }) => (
            <DashboardRow
              key={key}
              title={DASHBOARD_SECTIONS[key].title}
              to={libraryId ? `/libraries/${libraryId}/sections/${key}` : `/dashboard/sections/${key}`}
              query={query}
              keyOf={(item) => item.id}
              renderItem={DASHBOARD_SECTIONS[key].renderRow}
            />
          ))}
        </div>
      )}
    </div>
  )
}
