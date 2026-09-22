import type { PageHashAction } from '@/lib/api/types'

export const ACTION_LABELS: Record<PageHashAction, string> = {
  DELETE_AUTO: 'Delete auto',
  DELETE_MANUAL: 'Delete manual',
  IGNORE: 'Ignore',
}
