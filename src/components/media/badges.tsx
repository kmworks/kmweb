import { cn } from '@/lib/utils/cn'

/** Capsule progress bar pinned to the bottom of a cover. */
export function ProgressCapsule({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(1, value))
  if (pct <= 0) return null
  return (
    <div className={cn('pointer-events-none absolute inset-x-1.5 bottom-1.5 h-1 rounded-full bg-black/45', className)}>
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-300"
        style={{ width: `${Math.max(pct * 100, 4)}%` }}
      />
    </div>
  )
}

/** Small dot marking an unread book; same style family and position as the series UnreadBadge. */
export function UnreadDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute -top-1.5 -right-1.5 size-3 rounded-full',
        'bg-accent shadow-[0_1px_4px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.25)] ring-2 ring-bg',
        className,
      )}
    />
  )
}

/** Floating unread-count badge, top-right, slightly outside the cover edge. */
export function UnreadBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'pointer-events-none absolute -top-1.5 -right-1.5 z-10 flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-1.5',
        'bg-accent text-[11px] font-semibold text-white tabular-nums',
        'shadow-[0_1px_4px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.25)] ring-2 ring-bg',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
