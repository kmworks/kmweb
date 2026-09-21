export type GroupKey =
  | 'readStatus'
  | 'seriesStatus'
  | 'publishers'
  | 'genres'
  | 'tags'
  | 'ageRatings'
  | 'languages'
  | 'releaseYears'
  | 'authors'
  | 'mediaProfiles'
  | 'mediaStatuses'

/** How multiple values inside one group combine in the search DSL. */
export type GroupMode = 'any' | 'all'

export interface AuthorFilter {
  name: string
  role: string
}

export interface FilterState {
  q: string
  readStatus: string[]
  seriesStatus: string[]
  publishers: string[]
  genres: string[]
  tags: string[]
  ageRatings: string[]
  languages: string[]
  releaseYears: string[]
  authors: AuthorFilter[]
  mediaProfiles: string[]
  mediaStatuses: string[]
  /** groups combined with allOf instead of the default anyOf */
  matchAll: GroupKey[]
}

export type ReferentialKind =
  | 'publishers'
  | 'genres'
  | 'seriesTags'
  | 'bookTags'
  | 'ageRatings'
  | 'languages'
  | 'releaseDates'

export interface FilterGroupDef {
  key: GroupKey
  label: string
  kind: 'enum' | 'referential' | 'authors'
  options?: { value: string; label: string }[]
  referential?: ReferentialKind
}

export interface SortOption {
  label: string
  property: string
}

export interface SortState {
  property: string
  direction: 'asc' | 'desc'
}

const READ_STATUS_OPTIONS = [
  { value: 'READ', label: 'Read' },
  { value: 'UNREAD', label: 'Unread' },
  { value: 'IN_PROGRESS', label: 'In progress' },
]

export const SERIES_FILTER_GROUPS: FilterGroupDef[] = [
  { key: 'readStatus', label: 'Read status', kind: 'enum', options: READ_STATUS_OPTIONS },
  {
    key: 'seriesStatus',
    label: 'Series status',
    kind: 'enum',
    options: [
      { value: 'ONGOING', label: 'Ongoing' },
      { value: 'ENDED', label: 'Ended' },
      { value: 'ABANDONED', label: 'Abandoned' },
      { value: 'HIATUS', label: 'Hiatus' },
    ],
  },
  { key: 'publishers', label: 'Publishers', kind: 'referential', referential: 'publishers' },
  { key: 'genres', label: 'Genres', kind: 'referential', referential: 'genres' },
  { key: 'tags', label: 'Tags', kind: 'referential', referential: 'seriesTags' },
  { key: 'ageRatings', label: 'Age rating', kind: 'referential', referential: 'ageRatings' },
  { key: 'languages', label: 'Languages', kind: 'referential', referential: 'languages' },
  { key: 'releaseYears', label: 'Release years', kind: 'referential', referential: 'releaseDates' },
  { key: 'authors', label: 'Authors', kind: 'authors' },
]

export const BOOK_FILTER_GROUPS: FilterGroupDef[] = [
  { key: 'readStatus', label: 'Read status', kind: 'enum', options: READ_STATUS_OPTIONS },
  { key: 'tags', label: 'Tags', kind: 'referential', referential: 'bookTags' },
  {
    key: 'mediaProfiles',
    label: 'Media profile',
    kind: 'enum',
    options: [
      { value: 'DIVINA', label: 'Divina' },
      { value: 'PDF', label: 'PDF' },
      { value: 'EPUB', label: 'EPUB' },
    ],
  },
  {
    key: 'mediaStatuses',
    label: 'Media status',
    kind: 'enum',
    options: [
      { value: 'READY', label: 'Ready' },
      { value: 'ERROR', label: 'Error' },
      { value: 'UNKNOWN', label: 'Unknown' },
      { value: 'UNSUPPORTED', label: 'Unsupported' },
      { value: 'OUTDATED', label: 'Outdated' },
    ],
  },
  { key: 'releaseYears', label: 'Release years', kind: 'referential', referential: 'releaseDates' },
  { key: 'authors', label: 'Authors', kind: 'authors' },
]

export const SERIES_SORT_OPTIONS: SortOption[] = [
  { label: 'Title', property: 'metadata.titleSort' },
  { label: 'Date added', property: 'createdDate' },
  { label: 'Date updated', property: 'lastModifiedDate' },
  { label: 'Release date', property: 'booksMetadata.releaseDate' },
  { label: 'Last read', property: 'readDate' },
  { label: 'Folder name', property: 'name' },
  { label: 'Books count', property: 'booksCount' },
  { label: 'Random', property: 'random' },
]

export const BOOK_SORT_OPTIONS: SortOption[] = [
  { label: 'Title', property: 'metadata.titleSort' },
  { label: 'Series', property: 'series' },
  { label: 'Number', property: 'metadata.numberSort' },
  { label: 'Date added', property: 'createdDate' },
  { label: 'Date updated', property: 'lastModifiedDate' },
  { label: 'Release date', property: 'metadata.releaseDate' },
  { label: 'Last read', property: 'readProgress.readDate' },
  { label: 'File size', property: 'fileSize' },
  { label: 'Pages', property: 'media.pagesCount' },
]

export const SERIES_DEFAULT_SORT: SortState = { property: 'metadata.titleSort', direction: 'asc' }
export const BOOK_DEFAULT_SORT: SortState = { property: 'name', direction: 'asc' }
