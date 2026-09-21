import { ApiError } from '@/lib/api/client'
import type { LibraryCreationDto, LibraryDto, LibraryUpdateDto, ScanInterval, SeriesCover } from '@/lib/api/types'

/** Every editable boolean flag on a library (unavailable is server-managed). */
export type BoolKey = Exclude<
  { [K in keyof LibraryDto]-?: LibraryDto[K] extends boolean ? K : never }[keyof LibraryDto],
  'unavailable'
>

export type LibraryFormState = Pick<LibraryDto, BoolKey | 'scanInterval' | 'seriesCover' | 'scanDirectoryExclusions'> & {
  name: string
  root: string
  /** '' = unset; mapped to omitted on create, null on update when cleared */
  oneshotsDirectory: string
}

const BOOL_KEYS: BoolKey[] = [
  'importComicInfoBook',
  'importComicInfoSeries',
  'importComicInfoCollection',
  'importComicInfoReadList',
  'importComicInfoSeriesAppendVolume',
  'importEpubBook',
  'importEpubSeries',
  'importMylarSeries',
  'importLocalArtwork',
  'importBarcodeIsbn',
  'scanForceModifiedTime',
  'scanOnStartup',
  'scanCbx',
  'scanPdf',
  'scanEpub',
  'repairExtensions',
  'convertToCbz',
  'emptyTrashAfterScan',
  'hashFiles',
  'hashPages',
  'hashKoreader',
  'analyzeDimensions',
]

/** Server-side defaults; create bodies diff against this so unchanged fields stay omitted. */
export const DEFAULTS: LibraryFormState = {
  name: '',
  root: '',
  oneshotsDirectory: '',
  scanInterval: 'EVERY_6H',
  scanOnStartup: false,
  scanForceModifiedTime: false,
  scanCbx: true,
  scanPdf: true,
  scanEpub: true,
  scanDirectoryExclusions: [],
  importComicInfoBook: true,
  importComicInfoSeries: true,
  importComicInfoCollection: true,
  importComicInfoReadList: true,
  importComicInfoSeriesAppendVolume: true,
  importEpubBook: true,
  importEpubSeries: true,
  importMylarSeries: true,
  importLocalArtwork: true,
  importBarcodeIsbn: true,
  hashFiles: true,
  hashPages: false,
  hashKoreader: false,
  analyzeDimensions: true,
  repairExtensions: false,
  convertToCbz: false,
  emptyTrashAfterScan: false,
  seriesCover: 'FIRST',
}

export function formFromLibrary(lib: LibraryDto): LibraryFormState {
  const bools = {} as Pick<LibraryFormState, BoolKey>
  for (const k of BOOL_KEYS) bools[k] = lib[k]
  return {
    ...bools,
    name: lib.name,
    root: lib.root,
    oneshotsDirectory: lib.oneshotsDirectory ?? '',
    scanInterval: lib.scanInterval,
    seriesCover: lib.seriesCover,
    scanDirectoryExclusions: [...lib.scanDirectoryExclusions],
  }
}

function sameStrings(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

export function diffCreation(s: LibraryFormState): LibraryCreationDto {
  const body: LibraryCreationDto = { name: s.name.trim(), root: s.root.trim() }
  const oneshots = s.oneshotsDirectory.trim()
  if (oneshots) body.oneshotsDirectory = oneshots
  for (const k of BOOL_KEYS) if (s[k] !== DEFAULTS[k]) body[k] = s[k]
  if (s.scanInterval !== DEFAULTS.scanInterval) body.scanInterval = s.scanInterval
  if (s.seriesCover !== DEFAULTS.seriesCover) body.seriesCover = s.seriesCover
  if (s.scanDirectoryExclusions.length) body.scanDirectoryExclusions = s.scanDirectoryExclusions
  return body
}

export function diffUpdate(s: LibraryFormState, orig: LibraryDto): LibraryUpdateDto {
  const body: LibraryUpdateDto = {}
  const name = s.name.trim()
  const root = s.root.trim()
  if (name !== orig.name) body.name = name
  if (root !== orig.root) body.root = root
  const oneshots = s.oneshotsDirectory.trim()
  if (oneshots !== (orig.oneshotsDirectory ?? '')) body.oneshotsDirectory = oneshots || null
  for (const k of BOOL_KEYS) if (s[k] !== orig[k]) body[k] = s[k]
  if (s.scanInterval !== orig.scanInterval) body.scanInterval = s.scanInterval
  if (s.seriesCover !== orig.seriesCover) body.seriesCover = s.seriesCover
  if (!sameStrings(s.scanDirectoryExclusions, orig.scanDirectoryExclusions))
    body.scanDirectoryExclusions = s.scanDirectoryExclusions
  return body
}

/** Editing any of these makes the server rescan the library. */
export const RESCAN_PATCH_KEYS = [
  'root',
  'oneshotsDirectory',
  'scanCbx',
  'scanPdf',
  'scanEpub',
  'scanForceModifiedTime',
  'scanDirectoryExclusions',
] as const

/** Newly enabling any of these queues background tasks for existing books. */
export const BATCH_ENABLE_KEYS = ['hashFiles', 'hashPages', 'hashKoreader', 'repairExtensions', 'convertToCbz'] as const

export const SCAN_INTERVAL_OPTIONS: { value: ScanInterval; label: string }[] = [
  { value: 'DISABLED', label: 'Disabled' },
  { value: 'HOURLY', label: 'Hourly' },
  { value: 'EVERY_6H', label: 'Every 6h' },
  { value: 'EVERY_12H', label: 'Every 12h' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
]

export const SERIES_COVER_OPTIONS: { value: SeriesCover; label: string }[] = [
  { value: 'FIRST', label: 'First' },
  { value: 'FIRST_UNREAD_OR_FIRST', label: 'First unread or first' },
  { value: 'FIRST_UNREAD_OR_LAST', label: 'First unread or last' },
  { value: 'LAST', label: 'Last' },
]

export function scanIntervalBadge(interval: ScanInterval): string | null {
  switch (interval) {
    case 'DISABLED':
      return null
    case 'HOURLY':
      return 'Hourly'
    case 'EVERY_6H':
      return 'Every 6h'
    case 'EVERY_12H':
      return 'Every 12h'
    case 'DAILY':
      return 'Daily'
    case 'WEEKLY':
      return 'Weekly'
  }
}

export const SCAN_SWITCH_FIELDS: { key: BoolKey; label: string }[] = [
  { key: 'scanOnStartup', label: 'Scan on startup' },
  { key: 'scanForceModifiedTime', label: 'Force modified time' },
  { key: 'scanCbx', label: 'Scan CBX/CBR' },
  { key: 'scanPdf', label: 'Scan PDF' },
  { key: 'scanEpub', label: 'Scan EPUB' },
]

export const IMPORT_FIELDS: { key: BoolKey; label: string }[] = [
  { key: 'importComicInfoBook', label: 'ComicInfo book' },
  { key: 'importComicInfoSeries', label: 'ComicInfo series' },
  { key: 'importComicInfoCollection', label: 'ComicInfo collection' },
  { key: 'importComicInfoReadList', label: 'ComicInfo read list' },
  { key: 'importComicInfoSeriesAppendVolume', label: 'ComicInfo series append volume' },
  { key: 'importEpubBook', label: 'EPUB book' },
  { key: 'importEpubSeries', label: 'EPUB series' },
  { key: 'importMylarSeries', label: 'Mylar series' },
  { key: 'importLocalArtwork', label: 'Local artwork' },
  { key: 'importBarcodeIsbn', label: 'Barcode ISBN' },
]

export const ANALYSIS_FIELDS: { key: BoolKey; label: string }[] = [
  { key: 'hashFiles', label: 'Hash files' },
  { key: 'hashPages', label: 'Hash pages' },
  { key: 'hashKoreader', label: 'Hash Koreader position' },
  { key: 'analyzeDimensions', label: 'Analyze dimensions' },
  { key: 'repairExtensions', label: 'Repair extensions' },
  { key: 'convertToCbz', label: 'Convert to CBZ' },
  { key: 'emptyTrashAfterScan', label: 'Empty trash after scan' },
]

export interface Violation {
  fieldName: string
  message: string
}

/** Spring 400 bodies carry {violations:[{fieldName,message}]}; anything else yields []. */
export function parseViolations(err: unknown): Violation[] {
  if (!(err instanceof ApiError)) return []
  const body = err.body
  if (!body || typeof body !== 'object' || !('violations' in body)) return []
  const list = (body as { violations: unknown }).violations
  if (!Array.isArray(list)) return []
  return list.filter(
    (v): v is Violation =>
      !!v &&
      typeof v === 'object' &&
      typeof (v as Violation).fieldName === 'string' &&
      typeof (v as Violation).message === 'string',
  )
}
