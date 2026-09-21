import type { Role } from '@/lib/api/types'

// USER is implicit on every account: the server always returns it, but it must
// never appear in submit payloads and is not worth a chip of its own.
export const ASSIGNABLE_ROLES: { value: Role; label: string; description: string }[] = [
  { value: 'ADMIN', label: 'Administrator', description: 'Full access, including server settings' },
  { value: 'FILE_DOWNLOAD', label: 'File download', description: 'Download book files' },
  { value: 'PAGE_STREAMING', label: 'Page streaming', description: 'Stream pages for online reading' },
  { value: 'KOBO_SYNC', label: 'Kobo sync', description: 'Sync with Kobo e-readers' },
  { value: 'KOREADER_SYNC', label: 'KOReader sync', description: 'Sync reading progress with KOReader' },
]
