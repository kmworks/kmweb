import type { ReactNode } from 'react'
import { booksApi } from '@/lib/api/books'
import { seriesApi } from '@/lib/api/series'
import type { BookDto, Page, SearchCondition, SeriesDto } from '@/lib/api/types'
import { BookCard } from '@/components/media/BookCard'
import { KeepReadingCard } from '@/components/media/KeepReadingCard'
import { SeriesCard } from '@/components/media/SeriesCard'
import { dashboardCardWidth } from '@/components/dashboard/DashboardRow'

const PAGE_SIZE = 20

export interface DashboardSectionDef {
  title: string
  kind: 'book' | 'series'
  /** libraryIds undefined aggregates every library; callers must not pass an empty array */
  fetchPage: (libraryIds: string[] | undefined, page: number) => Promise<Page<BookDto | SeriesDto>>
  renderRow: (item: BookDto | SeriesDto) => ReactNode
  renderGrid: (item: BookDto | SeriesDto) => ReactNode
}

interface BookSectionDef {
  title: string
  fetchPage: (libraryIds: string[] | undefined, page: number) => Promise<Page<BookDto>>
  renderRow: (book: BookDto) => ReactNode
  renderGrid: (book: BookDto) => ReactNode
}

interface SeriesSectionDef {
  title: string
  fetchPage: (libraryIds: string[] | undefined, page: number) => Promise<Page<SeriesDto>>
  renderRow: (series: SeriesDto) => ReactNode
  renderGrid: (series: SeriesDto) => ReactNode
}

// per-kind defs keep card props typed; the record erases to the union for shared consumption
const bookSection = (def: BookSectionDef): DashboardSectionDef => ({ kind: 'book', ...def }) as DashboardSectionDef
const seriesSection = (def: SeriesSectionDef): DashboardSectionDef => ({ kind: 'series', ...def }) as DashboardSectionDef

function libraryConditions(libraryIds: string[] | undefined): SearchCondition[] {
  if (!libraryIds || libraryIds.length === 0) return []
  if (libraryIds.length === 1) return [{ libraryId: { operator: 'is', value: libraryIds[0] } }]
  return [{ anyOf: libraryIds.map((id) => ({ libraryId: { operator: 'is', value: id } }) as SearchCondition) }]
}

const bookRow = (b: BookDto) => <BookCard book={b} showSeries className={dashboardCardWidth} />
const bookGrid = (b: BookDto) => <BookCard book={b} showSeries />
const seriesRow = (s: SeriesDto) => <SeriesCard series={s} className={dashboardCardWidth} />
const seriesGrid = (s: SeriesDto) => <SeriesCard series={s} />

export const DASHBOARD_SECTIONS = {
  'keep-reading': bookSection({
    title: 'Keep Reading',
    fetchPage: (libraryIds, page) =>
      booksApi.list({
        search: {
          condition: {
            allOf: [{ readStatus: { operator: 'is', value: 'IN_PROGRESS' } }, ...libraryConditions(libraryIds)],
          },
        },
        page,
        size: PAGE_SIZE,
        sort: ['readProgress.readDate,desc'],
      }),
    renderRow: (b) => <KeepReadingCard book={b} className="snap-start" />,
    renderGrid: bookGrid,
  }),
  'on-deck': bookSection({
    title: 'On Deck',
    fetchPage: (libraryIds, page) =>
      booksApi.ondeck({ libraryId: libraryIds, page, size: PAGE_SIZE }),
    renderRow: bookRow,
    renderGrid: bookGrid,
  }),
  'recently-released-books': bookSection({
    title: 'Recently Released Books',
    fetchPage: (libraryIds, page) =>
      booksApi.list({
        search: { condition: { allOf: [{ releaseDate: { operator: 'isNotNull' } }, ...libraryConditions(libraryIds)] } },
        page,
        size: PAGE_SIZE,
        sort: ['metadata.releaseDate,desc'],
      }),
    renderRow: bookRow,
    renderGrid: bookGrid,
  }),
  'recently-added-books': bookSection({
    title: 'Recently Added Books',
    fetchPage: (libraryIds, page) =>
      libraryIds?.length
        ? booksApi.list({
            search: { condition: { allOf: libraryConditions(libraryIds) } },
            page,
            size: PAGE_SIZE,
            sort: ['createdDate,desc'],
          })
        : booksApi.latest({ page, size: PAGE_SIZE }),
    renderRow: bookRow,
    renderGrid: bookGrid,
  }),
  'recently-added-series': seriesSection({
    title: 'Recently Added Series',
    fetchPage: (libraryIds, page) =>
      seriesApi.new({ libraryId: libraryIds, page, size: PAGE_SIZE }),
    renderRow: seriesRow,
    renderGrid: seriesGrid,
  }),
  'recently-updated-series': seriesSection({
    title: 'Recently Updated Series',
    fetchPage: (libraryIds, page) =>
      seriesApi.updated({ libraryId: libraryIds, page, size: PAGE_SIZE }),
    renderRow: seriesRow,
    renderGrid: seriesGrid,
  }),
  'recently-read': bookSection({
    title: 'Recently Read',
    fetchPage: (libraryIds, page) =>
      booksApi.list({
        search: {
          condition: {
            allOf: [{ readStatus: { operator: 'is', value: 'READ' } }, ...libraryConditions(libraryIds)],
          },
        },
        page,
        size: PAGE_SIZE,
        sort: ['readProgress.readDate,desc'],
      }),
    renderRow: bookRow,
    renderGrid: bookGrid,
  }),
} satisfies Record<string, DashboardSectionDef>

export type DashboardSectionKey = keyof typeof DASHBOARD_SECTIONS
