import { api } from './client'
import type { AuthorDto } from './types'

// v1 referential endpoints return plain string arrays.
export const referentialApi = {
  genres: (params?: { libraryId?: string[]; collectionId?: string }) =>
    api.get<string[]>('/api/v1/genres', { library_id: params?.libraryId, collection_id: params?.collectionId }),
  seriesTags: (params?: { libraryId?: string[]; collectionId?: string }) =>
    api.get<string[]>('/api/v1/tags/series', { library_id: params?.libraryId, collection_id: params?.collectionId }),
  bookTags: (params?: { libraryId?: string[] }) =>
    api.get<string[]>('/api/v1/tags/book', { library_id: params?.libraryId }),
  publishers: (params?: { libraryId?: string[]; collectionId?: string }) =>
    api.get<string[]>('/api/v1/publishers', { library_id: params?.libraryId, collection_id: params?.collectionId }),
  ageRatings: (params?: { libraryId?: string[] }) =>
    api.get<string[]>('/api/v1/age-ratings', { library_id: params?.libraryId }),
  languages: (params?: { libraryId?: string[]; collectionId?: string }) =>
    api.get<string[]>('/api/v1/languages', { library_id: params?.libraryId, collection_id: params?.collectionId }),
  sharingLabels: (params?: { libraryId?: string[] }) =>
    api.get<string[]>('/api/v1/sharing-labels', { library_id: params?.libraryId }),
  releaseDates: (params?: { libraryId?: string[] }) =>
    api.get<string[]>('/api/v1/series/release-dates', { library_id: params?.libraryId }),
  authors: (params?: { libraryId?: string; collectionId?: string; seriesId?: string; search?: string }) =>
    api.get<AuthorDto[]>('/api/v1/authors', {
      library_id: params?.libraryId,
      collection_id: params?.collectionId,
      series_id: params?.seriesId,
      search: params?.search,
    }),
  authorRoles: () => api.get<string[]>('/api/v1/authors/roles'),
}
