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
  fetchPage: (libraryId: string | undefined, page: number) => Promise<Page<BookDto | SeriesDto>>
  renderRow: (item: BookDto | SeriesDto) => ReactNode
  renderGrid: (item: BookDto | SeriesDto) => ReactNode
}

interface BookSectionDef {
  title: string
  fetchPage: (libraryId: string | undefined, page: number) => Promise<Page<BookDto>>
  renderRow: (book: BookDto) => ReactNode
  renderGrid: (book: BookDto) => ReactNode
}

interface SeriesSectionDef {
  title: string
  fetchPage: (libraryId: string | undefined, page: number) => Promise<Page<SeriesDto>>
  renderRow: (series: SeriesDto) => ReactNode
  renderGrid: (series: SeriesDto) => ReactNode
}

// per-kind defs keep card props typed; the record erases to the union for shared consumption
const bookSection = (def: BookSectionDef): DashboardSectionDef => ({ kind: 'book', ...def }) as DashboardSectionDef
const seriesSection = (def: SeriesSectionDef): DashboardSectionDef => ({ kind: 'series', ...def }) as DashboardSectionDef

function libraryConditions(libraryId: string | undefined): SearchCondition[] {
  return libraryId ? [{ libraryId: { operator: 'is', value: libraryId } }] : []
}

const bookRow = (b: BookDto) => <BookCard book={b} showSeries className={dashboardCardWidth} />
const bookGrid = (b: BookDto) => <BookCard book={b} showSeries />
const seriesRow = (s: SeriesDto) => <SeriesCard series={s} className={dashboardCardWidth} />
const seriesGrid = (s: SeriesDto) => <SeriesCard series={s} />

export const DASHBOARD_SECTIONS = {
  'keep-reading': bookSection({
    title: 'Keep Reading',
    fetchPage: (libraryId, page) =>
      booksApi.list({
        search: {
          condition: {
            allOf: [{ readStatus: { operator: 'is', value: 'IN_PROGRESS' } }, ...libraryConditions(libraryId)],
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
    fetchPage: (libraryId, page) =>
      booksApi.ondeck({ libraryId: libraryId ? [libraryId] : undefined, page, size: PAGE_SIZE }),
    renderRow: bookRow,
    renderGrid: bookGrid,
  }),
  'recently-released-books': bookSection({
    title: 'Recently Released Books',
    fetchPage: (libraryId, page) =>
      booksApi.list({
        search: { condition: { allOf: [{ releaseDate: { operator: 'isNotNull' } }, ...libraryConditions(libraryId)] } },
        page,
        size: PAGE_SIZE,
        sort: ['metadata.releaseDate,desc'],
      }),
    renderRow: bookRow,
    renderGrid: bookGrid,
  }),
  'recently-added-books': bookSection({
    title: 'Recently Added Books',
    fetchPage: (libraryId, page) =>
      libraryId
        ? booksApi.list({
            search: { condition: { allOf: libraryConditions(libraryId) } },
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
    fetchPage: (libraryId, page) =>
      seriesApi.new({ libraryId: libraryId ? [libraryId] : undefined, page, size: PAGE_SIZE }),
    renderRow: seriesRow,
    renderGrid: seriesGrid,
  }),
  'recently-updated-series': seriesSection({
    title: 'Recently Updated Series',
    fetchPage: (libraryId, page) =>
      seriesApi.updated({ libraryId: libraryId ? [libraryId] : undefined, page, size: PAGE_SIZE }),
    renderRow: seriesRow,
    renderGrid: seriesGrid,
  }),
  'recently-read': seriesSection({
    title: 'Recently Read',
    fetchPage: (libraryId, page) => {
      const readCondition: SearchCondition = {
        anyOf: [
          { readStatus: { operator: 'is', value: 'READ' } },
          { readStatus: { operator: 'is', value: 'IN_PROGRESS' } },
        ],
      }
      return seriesApi.list({
        search: { condition: libraryId ? { allOf: [readCondition, ...libraryConditions(libraryId)] } : readCondition },
        page,
        size: PAGE_SIZE,
        sort: ['readDate,desc'],
      })
    },
    renderRow: seriesRow,
    renderGrid: seriesGrid,
  }),
} satisfies Record<string, DashboardSectionDef>

export type DashboardSectionKey = keyof typeof DASHBOARD_SECTIONS
