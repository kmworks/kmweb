import { api } from './client'
import type { JsonFeedDto } from './types'

/** Admin-only announcements proxy (upstream JSON feed, cached server-side). */
export const announcementsApi = {
  list: () => api.get<JsonFeedDto>('/api/v1/announcements'),
  markRead: (ids: string[]) => api.put<void>('/api/v1/announcements', ids),
}
