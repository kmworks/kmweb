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
  secondary?: string
  center?: boolean
}

/** Title block under a cover; honors the global card-style preference. */
export function CardText({ title, secondary }: CardTextProps) {
  const cardStyle = useUiStore((s) => s.cardStyle)
  if (cardStyle === 'cover') return null
  return (
    <div className="mt-2 min-w-0 px-0.5">
      <p className="truncate text-[13px] leading-snug font-medium text-ink">{title}</p>
      {secondary && <p className="mt-0.5 truncate text-xs text-ink-3">{secondary}</p>}
    </div>
  )
}

/** Overlay variant: gradient on the cover itself, white text. */
export function CardOverlayText({ title, secondary }: CardTextProps) {
  const cardStyle = useUiStore((s) => s.cardStyle)
  if (cardStyle !== 'overlay') return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-lg bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2.5 pt-8 pb-2">
      <p className="truncate text-[12.5px] leading-snug font-medium text-white">{title}</p>
      {secondary && <p className="mt-0.5 truncate text-[11px] text-white/70">{secondary}</p>}
    </div>
  )
}
