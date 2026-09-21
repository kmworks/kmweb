import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { AuthorFilter, FilterGroupDef, FilterState, GroupKey, GroupMode } from './types'

/** multi-value URL params, one key per filter group (values repeat the key) */
const MULTI_KEYS: GroupKey[] = [
  'readStatus',
  'seriesStatus',
  'publishers',
  'genres',
  'tags',
  'ageRatings',
  'languages',
  'releaseYears',
  'authors',
  'mediaProfiles',
  'mediaStatuses',
]

// names may contain commas, so the role is split off at the last comma
export function parseAuthor(raw: string): AuthorFilter {
  const i = raw.lastIndexOf(',')
  return i < 0 ? { name: raw, role: '' } : { name: raw.slice(0, i), role: raw.slice(i + 1) }
}

export function serializeAuthor(a: AuthorFilter): string {
  return `${a.name},${a.role}`
}

export function parseFilterState(params: URLSearchParams): FilterState {
  return {
    q: params.get('q') ?? '',
    readStatus: params.getAll('readStatus'),
    seriesStatus: params.getAll('seriesStatus'),
    publishers: params.getAll('publishers'),
    genres: params.getAll('genres'),
    tags: params.getAll('tags'),
    ageRatings: params.getAll('ageRatings'),
    languages: params.getAll('languages'),
    releaseYears: params.getAll('releaseYears'),
    authors: params.getAll('authors').map(parseAuthor),
    mediaProfiles: params.getAll('mediaProfiles'),
    mediaStatuses: params.getAll('mediaStatuses'),
    matchAll: params.getAll('ma').filter((v): v is GroupKey => (MULTI_KEYS as string[]).includes(v)),
  }
}

/** stable key for react-query caching; state derives from the URL so order is deterministic */
export function serializeFilters(s: FilterState): string {
  return JSON.stringify(s)
}

export function activeFilterCount(s: FilterState): number {
  return (
    s.readStatus.length +
    s.seriesStatus.length +
    s.publishers.length +
    s.genres.length +
    s.tags.length +
    s.ageRatings.length +
    s.languages.length +
    s.releaseYears.length +
    s.authors.length +
    s.mediaProfiles.length +
    s.mediaStatuses.length
  )
}

export interface ActiveFilterItem {
  key: string
  label: string
  group: GroupKey | 'q'
  /** raw URL value; for authors the serialized "name,role" form */
  value: string
}

export function describeActiveFilters(state: FilterState, groups: FilterGroupDef[]): ActiveFilterItem[] {
  const items: ActiveFilterItem[] = []
  for (const def of groups) {
    if (def.kind === 'authors') {
      for (const a of state.authors) {
        items.push({
          key: `authors:${serializeAuthor(a)}`,
          label: `Author: ${a.role ? `${a.name} (${a.role})` : a.name}`,
          group: 'authors',
          value: serializeAuthor(a),
        })
      }
      continue
    }
    const values = state[def.key] as string[]
    for (const v of values) {
      const label = def.options?.find((o) => o.value === v)?.label ?? v
      items.push({ key: `${def.key}:${v}`, label: `${def.label}: ${label}`, group: def.key, value: v })
    }
  }
  if (state.q.trim()) items.push({ key: 'q', label: `Search: ${state.q}`, group: 'q', value: state.q })
  return items
}

function toggleParam(params: URLSearchParams, key: string, value: string) {
  const all = params.getAll(key)
  params.delete(key)
  const next = all.includes(value) ? all.filter((v) => v !== value) : [...all, value]
  for (const v of next) params.append(key, v)
}

export function useBrowseFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const state = useMemo(() => parseFilterState(searchParams), [searchParams])

  const update = useCallback(
    (mutate: (params: URLSearchParams) => void, replace = false) => {
      const next = new URLSearchParams(searchParams)
      mutate(next)
      setSearchParams(next, { replace })
    },
    [searchParams, setSearchParams],
  )

  const toggleValue = useCallback((key: GroupKey, value: string) => update((p) => toggleParam(p, key, value)), [update])

  const toggleAuthor = useCallback(
    (author: AuthorFilter) => update((p) => toggleParam(p, 'authors', serializeAuthor(author))),
    [update],
  )

  const setMode = useCallback(
    (key: GroupKey, mode: GroupMode) =>
      update((p) => {
        const rest = p.getAll('ma').filter((v) => v !== key)
        p.delete('ma')
        // 'any' is the default and stays out of the URL
        for (const v of mode === 'all' ? [...rest, key] : rest) p.append('ma', v)
      }),
    [update],
  )

  const setQ = useCallback(
    (q: string, replace = true) =>
      update(
        (p) => {
          if (q.trim()) p.set('q', q)
          else p.delete('q')
        },
        replace,
      ),
    [update],
  )

  const clearAll = useCallback(
    () =>
      update((p) => {
        for (const k of MULTI_KEYS) p.delete(k)
        p.delete('ma')
      }),
    [update],
  )

  return { state, toggleValue, toggleAuthor, setMode, setQ, clearAll }
}
