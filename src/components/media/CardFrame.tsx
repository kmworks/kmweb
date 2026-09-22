import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'
import { useUiStore } from '@/lib/store/ui'

interface CardFrameProps {
  to: string
  children: ReactNode
  className?: string
  label: string
}

/** Shared hover/press treatment for all media cards. */
export function CardFrame({ to, children, className, label }: CardFrameProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        'group block cursor-pointer rounded-lg outline-none transition-transform duration-200 ease-out-expo',
        'active:scale-[0.98]',
        className,
      )}
    >
      {children}
    </Link>
  )
}

interface CardTextProps {
  title: string
  /** caption line above the title (e.g. series title) */
  overline?: ReactNode
  secondary?: ReactNode
  /** title clamps to this many lines (default 1) */
  titleLines?: 1 | 2
  center?: boolean
}

/** Title block under a cover; honors the global card-style preference. */
export function CardText({ title, overline, secondary, titleLines = 1 }: CardTextProps) {
  const cardStyle = useUiStore((s) => s.cardStyle)
  if (cardStyle !== 'standard') return null
  return (
    <div className="mt-2 min-w-0 px-0.5">
      {overline && <p className="mb-0.5 truncate text-[11px] leading-snug text-ink-3">{overline}</p>}
      <p className={cn('text-[13px] leading-snug font-medium text-ink', titleLines === 2 ? 'line-clamp-2' : 'truncate')}>
        {title}
      </p>
      {secondary && <p className="mt-0.5 truncate text-xs text-ink-3">{secondary}</p>}
    </div>
  )
}

/** Overlay variant: gradient on the cover itself, white text. */
export function CardOverlayText({ title, overline, secondary, titleLines = 1 }: CardTextProps) {
  const cardStyle = useUiStore((s) => s.cardStyle)
  if (cardStyle !== 'overlay') return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-lg bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2.5 pt-8 pb-2">
      {overline && <p className="mb-0.5 truncate text-[11px] text-white/70">{overline}</p>}
      <p className={cn('text-[12.5px] leading-snug font-medium text-white', titleLines === 2 ? 'line-clamp-2' : 'truncate')}>
        {title}
      </p>
      {secondary && <p className="mt-0.5 truncate text-[11px] text-white/70">{secondary}</p>}
    </div>
  )
}
