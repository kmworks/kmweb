import type { BookSearch, ConditionLeaf, SearchCondition, SearchOperator, SeriesSearch } from '@/lib/api/types'
import type { AuthorFilter, FilterState, GroupKey, GroupMode } from './types'

function leaf(key: string, operator: SearchOperator, value?: unknown): ConditionLeaf {
  return value === undefined ? { [key]: { operator } } : { [key]: { operator, value } }
}

function combine(conditions: SearchCondition[], mode: GroupMode): SearchCondition | undefined {
  if (conditions.length === 0) return undefined
  if (conditions.length === 1) return conditions[0]
  return mode === 'any' ? { anyOf: conditions } : { allOf: conditions }
}

function push(out: SearchCondition[], condition: SearchCondition | undefined) {
  if (condition) out.push(condition)
}

function yearConditions(years: string[]): SearchCondition[] {
  return years.map((y) => ({
    allOf: [leaf('releaseDate', 'after', `${y}-01-01`), leaf('releaseDate', 'before', `${y}-12-31`)],
  }))
}

function authorConditions(authors: AuthorFilter[]): SearchCondition[] {
  return authors.map((a) => leaf('author', 'is', a.role ? { name: a.name, role: a.role } : { name: a.name }))
}

// the referential endpoint serves strings, but the ageRating leaf expects a number
function ageRatingValue(v: string): string | number {
  return /^\d+$/.test(v) ? Number(v) : v
}

function finalize(state: FilterState, conditions: SearchCondition[]): { condition?: SearchCondition; fullTextSearch?: string } {
  return {
    ...(conditions.length > 0 && { condition: conditions.length === 1 ? conditions[0] : { allOf: conditions } }),
    ...(state.q.trim() && { fullTextSearch: state.q.trim() }),
  }
}

export function buildSeriesSearch(state: FilterState, libraryId?: string): SeriesSearch {
  const mode = (g: GroupKey): GroupMode => (state.matchAll.includes(g) ? 'all' : 'any')
  const conditions: SearchCondition[] = []
  if (libraryId) conditions.push(leaf('libraryId', 'is', libraryId))
  push(conditions, combine(state.readStatus.map((v) => leaf('readStatus', 'is', v)), mode('readStatus')))
  push(conditions, combine(state.seriesStatus.map((v) => leaf('seriesStatus', 'is', v)), mode('seriesStatus')))
  push(conditions, combine(state.publishers.map((v) => leaf('publisher', 'is', v)), mode('publishers')))
  push(conditions, combine(state.genres.map((v) => leaf('genre', 'is', v)), mode('genres')))
  push(conditions, combine(state.tags.map((v) => leaf('tag', 'is', v)), mode('tags')))
  push(conditions, combine(state.ageRatings.map((v) => leaf('ageRating', 'is', ageRatingValue(v))), mode('ageRatings')))
  push(conditions, combine(state.languages.map((v) => leaf('language', 'is', v)), mode('languages')))
  push(conditions, combine(yearConditions(state.releaseYears), mode('releaseYears')))
  push(conditions, combine(authorConditions(state.authors), mode('authors')))
  return finalize(state, conditions)
}

export function buildBookSearch(state: FilterState, libraryId?: string): BookSearch {
  const mode = (g: GroupKey): GroupMode => (state.matchAll.includes(g) ? 'all' : 'any')
  const conditions: SearchCondition[] = []
  if (libraryId) conditions.push(leaf('libraryId', 'is', libraryId))
  push(conditions, combine(state.readStatus.map((v) => leaf('readStatus', 'is', v)), mode('readStatus')))
  push(conditions, combine(state.tags.map((v) => leaf('tag', 'is', v)), mode('tags')))
  push(conditions, combine(state.mediaProfiles.map((v) => leaf('mediaProfile', 'is', v)), mode('mediaProfiles')))
  push(conditions, combine(state.mediaStatuses.map((v) => leaf('mediaStatus', 'is', v)), mode('mediaStatuses')))
  push(conditions, combine(yearConditions(state.releaseYears), mode('releaseYears')))
  push(conditions, combine(authorConditions(state.authors), mode('authors')))
  return finalize(state, conditions)
}
