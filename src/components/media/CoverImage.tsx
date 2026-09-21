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
    <div className={cn('cover-aspect relative w-full overflow-hidden rounded-lg bg-raised', className)}>
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
            'absolute inset-0 size-full object-cover transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0',
            blurred && 'blur-[5px] scale-[1.04]',
          )}
        />
      )}
    </div>
  )
}
