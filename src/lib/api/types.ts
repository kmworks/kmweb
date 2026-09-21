// DTOs mirroring the Komga 1.27 OpenAPI schemas (camelCase field names as served).

export interface Page<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: { empty: boolean; sorted: boolean; unsorted: boolean }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
  number: number
  size: number
  numberOfElements: number
  sort: { empty: boolean; sorted: boolean; unsorted: boolean }
  empty: boolean
}

export interface PageParams {
  page?: number
  size?: number
  sort?: string[]
  unpaged?: boolean
}

export type ReadingDirection = 'LEFT_TO_RIGHT' | 'RIGHT_TO_LEFT' | 'VERTICAL' | 'WEBTOON'
export type SeriesStatus = 'ONGOING' | 'ENDED' | 'ABANDONED' | 'HIATUS'
export type ReadStatus = 'READ' | 'UNREAD' | 'IN_PROGRESS'
export type MediaStatus = 'UNKNOWN' | 'ERROR' | 'READY' | 'UNSUPPORTED' | 'OUTDATED'
export type MediaProfile = 'DIVINA' | 'PDF' | 'EPUB'
export type Role = 'ADMIN' | 'USER' | 'FILE_DOWNLOAD' | 'PAGE_STREAMING' | 'KOBO_SYNC' | 'KOREADER_SYNC'

export interface LibraryDto {
  id: string
  name: string
  root: string
  unavailable: boolean
  seriesCover: 'FIRST' | 'FIRST_UNREAD_OR_FIRST' | 'FIRST_UNREAD_OR_LAST' | 'LAST'
  oneshotsDirectory?: string
}

export interface AlternateTitleDto {
  label: string
  title: string
}

export interface WebLinkDto {
  label: string
  url: string
}

export interface AuthorDto {
  name: string
  role: string
}

export interface SeriesMetadataDto {
  title: string
  titleSort: string
  status: SeriesStatus
  statusLock: boolean
  summary: string
  summaryLock: boolean
  publisher: string
  publisherLock: boolean
  ageRating?: number
  ageRatingLock: boolean
  language: string
  languageLock: boolean
  readingDirection: ReadingDirection
  readingDirectionLock: boolean
  genres: string[]
  genresLock: boolean
  tags: string[]
  tagsLock: boolean
  sharingLabels: string[]
  sharingLabelsLock: boolean
  alternateTitles: AlternateTitleDto[]
  alternateTitlesLock: boolean
  links: WebLinkDto[]
  linksLock: boolean
  totalBookCount?: number
  totalBookCountLock: boolean
  created: string
  lastModified: string
}

export interface BookMetadataAggregationDto {
  authors: AuthorDto[]
  tags: string[]
  releaseDate?: string
  summary: string
  summaryNumber: string
  created: string
  lastModified: string
}

export interface SeriesDto {
  id: string
  libraryId: string
  name: string
  url: string
  created: string
  lastModified: string
  fileLastModified: string
  deleted: boolean
  oneshot: boolean
  booksCount: number
  booksReadCount: number
  booksUnreadCount: number
  booksInProgressCount: number
  metadata: SeriesMetadataDto
  booksMetadata: BookMetadataAggregationDto
}

export interface MediaDto {
  status: MediaStatus
  mediaType: string
  mediaProfile: MediaProfile
  pagesCount: number
  comment: string
  epubDivinaCompatible: boolean
  epubIsKepub: boolean
}

export interface BookMetadataDto {
  title: string
  summary: string
  number: string
  numberSort: number
  releaseDate?: string
  isbn: string
  tags: string[]
  authors: AuthorDto[]
  links: WebLinkDto[]
  created: string
  lastModified: string
}

export interface ReadProgressDto {
  page: number
  completed: boolean
  readDate?: string
  created: string
  lastModified: string
  deviceId: string
  deviceName: string
}

export interface BookDto {
  id: string
  seriesId: string
  seriesTitle: string
  libraryId: string
  name: string
  url: string
  number: number
  created: string
  lastModified: string
  fileLastModified: string
  deleted: boolean
  oneshot: boolean
  size: string
  sizeBytes: number
  fileHash: string
  media: MediaDto
  metadata: BookMetadataDto
  readProgress?: ReadProgressDto
}

export interface PageDto {
  number: number
  fileName: string
  mediaType: string
  width?: number
  height?: number
  size: string
  sizeBytes?: number
}

export interface CollectionDto {
  id: string
  name: string
  ordered: boolean
  filtered: boolean
  seriesIds: string[]
  createdDate: string
  lastModifiedDate: string
}

export interface ReadListDto {
  id: string
  name: string
  summary: string
  ordered: boolean
  filtered: boolean
  bookIds: string[]
  createdDate: string
  lastModifiedDate: string
}

export interface UserDto {
  id: string
  email: string
  roles: Role[]
  sharedAllLibraries: boolean
  sharedLibrariesIds: string[]
  labelsAllow: string[]
  labelsExclude: string[]
  ageRestriction?: { age: number; restriction: 'ALLOW_ONLY' | 'EXCLUDE' }
}

export interface GroupCountDto {
  group: string
  count: number
}

export interface OAuth2ClientDto {
  registrationId: string
  name: string
}

export interface ClaimStatus {
  isClaimed: boolean
}

export interface ApiKeyDto {
  id: string
  key?: string
  comment: string
  userId: string
  createdDate: string
  lastModifiedDate: string
}

export interface AuthenticationActivityDto {
  dateTime: string
  email?: string
  userId?: string
  apiKeyId?: string
  apiKeyComment?: string
  ip?: string
  userAgent?: string
  source?: string
  error?: string
  success: boolean
}

export interface ActuatorInfo {
  git?: { branch?: string; commit?: { id?: string; time?: string } }
  build?: { artifact?: string; name?: string; version?: string; group?: string }
}

// ---- Search DSL (POST /list bodies) ----

export type SearchOperator =
  | 'is'
  | 'isNot'
  | 'isNull'
  | 'isNotNull'
  | 'isTrue'
  | 'isFalse'
  | 'contains'
  | 'beginsWith'
  | 'endsWith'
  | 'doesNotContain'
  | 'doesNotBeginWith'
  | 'doesNotEndWith'
  | 'greaterThan'
  | 'lessThan'
  | 'before'
  | 'after'
  | 'isInTheLast'
  | 'isNotInTheLast'

export type ConditionLeaf = Record<string, { operator: SearchOperator; value?: unknown }>

export interface ConditionGroup {
  allOf?: SearchCondition[]
  anyOf?: SearchCondition[]
}

export type SearchCondition = ConditionLeaf | ConditionGroup

export interface SeriesSearch {
  condition?: SearchCondition
  fullTextSearch?: string
}

export interface BookSearch {
  condition?: SearchCondition
  fullTextSearch?: string
}
