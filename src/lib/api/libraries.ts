import { api } from './client'
import type { LibraryDto } from './types'

export const librariesApi = {
  list: () => api.get<LibraryDto[]>('/api/v1/libraries'),
  get: (libraryId: string) => api.get<LibraryDto>(`/api/v1/libraries/${libraryId}`),
}
