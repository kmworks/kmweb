import type { PageHashAction } from '@/lib/api/types'
import { cn } from '@/lib/utils/cn'
import { ACTION_LABELS } from './actionMeta'

const styles: Record<PageHashAction, string> = {
  DELETE_AUTO: 'border-danger/40 bg-danger/10 text-danger',
  DELETE_MANUAL: 'border-accent/40 bg-accent-soft text-accent-strong',
  IGNORE: 'border-line bg-raised text-ink-2',
}

export function HashActionBadge({ action, className }: { action: PageHashAction; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        styles[action],
        className,
      )}
    >
      {ACTION_LABELS[action]}
    </span>
  )
}
