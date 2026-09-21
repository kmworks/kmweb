import { api } from './client'
import type {
  ActuatorHealth,
  DirectoryListingDto,
  MetricDto,
  ScheduledTasksDto,
  SessionDto,
  SettingsDto,
  SettingsUpdateDto,
} from './types'

export const settingsApi = {
  get: () => api.get<SettingsDto>('/api/v1/settings'),
  update: (body: SettingsUpdateDto) => api.patch<void>('/api/v1/settings', body),
}

export const filesystemApi = {
  browse: (path?: string, showFiles = false) =>
    api.post<DirectoryListingDto>('/api/v1/filesystem', { path, showFiles }),
}

export const tasksApi = {
  /** Purges queued tasks (not ones already claimed by a worker); returns how many were removed. */
  clear: () => api.delete<number>('/api/v1/tasks'),
}

export const actuatorApi = {
  health: () => api.get<ActuatorHealth>('/actuator/health'),
  metricNames: () => api.get<{ names: string[] }>('/actuator/metrics'),
  metric: (name: string, tags?: string[]) => api.get<MetricDto>(`/actuator/metrics/${name}`, tags?.length ? { tag: tags } : undefined),
  scheduledTasks: () => api.get<ScheduledTasksDto>('/actuator/scheduledtasks'),
  sessions: (username?: string) => api.get<{ sessions: SessionDto[] }>('/actuator/sessions', { username }),
  deleteSession: (sessionId: string) => api.delete<void>(`/actuator/sessions/${sessionId}`),
}
