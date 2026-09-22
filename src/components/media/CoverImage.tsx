import { useState } from 'react'
import { BookOpen } from '@phosphor-icons/react'
import { cn } from '@/lib/utils/cn'

interface CoverImageProps {
  src: string
  alt: string
  className?: string
  /** spoiler blur (unread blur preference) */
  blurred?: boolean
  eager?: boolean
}

/** √2 cover with shimmer placeholder, fade-in on load and icon fallback. */
export function CoverImage({ src, alt, className, blurred, eager }: CoverImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className={cn('cover-aspect relative w-full overflow-hidden rounded-lg bg-raised transition-shadow duration-300 group-hover:shadow-card', className)}>
      {!loaded && !error && <div className="shimmer absolute inset-0" />}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-ink-3">
          <BookOpen className="size-8" weight="duotone" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            // scale is a separate CSS property in Tailwind v4; leaving it out of the transition list makes the hover zoom snap
            'absolute inset-0 size-full object-cover transition-[opacity,transform,scale,filter] duration-300 ease-out-expo group-hover:scale-[1.05] group-hover:brightness-[1.08]',
            loaded ? 'opacity-100' : 'opacity-0',
            blurred && 'blur-[5px] scale-[1.04]',
          )}
        />
      )}
      {/* hairline over the cover so dark covers stay distinguishable from the page background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] inset-ring-1 inset-ring-line" />
    </div>
  )
}
