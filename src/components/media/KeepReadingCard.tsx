import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Play } from '@phosphor-icons/react'
import type { BookDto } from '@/lib/api/types'
import { urls } from '@/lib/utils/urls'
import { readRoute } from '@/lib/utils/nav'
import { useBust } from '@/lib/store/thumbnails'
import { plural } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

/**
 * Apple Books-style resume card: blurred cover as the card background,
 * crisp cover on the left, progress line along the bottom edge.
 */
export function KeepReadingCard({ book, className }: { book: BookDto; className?: string }) {
  const bust = useBust(book.id)
  const cover = urls.bookThumbnail(book.id, bust || undefined)
  const to = readRoute(book) ?? `/book/${book.id}`
  const pct = book.media.pagesCount > 0 && book.readProgress ? book.readProgress.page / book.media.pagesCount : 0
  const [bgLoaded, setBgLoaded] = useState(false)

  return (
    <Link
      to={to}
      aria-label={`Continue reading ${book.metadata.title || book.name}`}
      className={cn(
        'group relative block w-[300px] shrink-0 cursor-pointer overflow-hidden rounded-xl bg-raised',
        'transition-[transform,scale,box-shadow,filter] duration-300 ease-out-expo group-hover:shadow-card group-hover:brightness-[1.07] active:scale-[0.98]',
        className,
      )}
    >
      {/* blurred cover backdrop: stretch (not crop) so the tint carries the cover's overall
          tone; the overscan keeps the blur from sampling past the image and darkening edges.
          Saturation is boosted past 1 or the tint washes out to gray under the dimming layer */}
      <img
        src={cover}
        alt=""
        aria-hidden
        loading="lazy"
        onLoad={() => setBgLoaded(true)}
        className={cn(
          'absolute inset-0 size-full scale-[1.3] object-fill blur-2xl saturate-[1.25] transition-opacity duration-500',
          bgLoaded ? 'opacity-100' : 'opacity-0',
        )}
      />
      {/* even dimming layer so the white title stays readable on light covers */}
      <div className="absolute inset-0 bg-black/30" />
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] inset-ring-1 inset-ring-line" />

      <div className="relative flex h-30 items-stretch gap-3.5 p-3.5">
        <img
          src={cover}
          alt={book.metadata.title || book.name}
          loading="lazy"
          draggable={false}
          className="cover-aspect h-full shrink-0 rounded-md object-cover shadow-[0_2px_10px_rgb(0_0_0/0.5)]"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
          <p className="truncate text-[11px] font-medium tracking-wide text-white/65 uppercase">{book.seriesTitle}</p>
          <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug font-medium text-white">
            {book.metadata.title || book.name}
          </p>
          <p className="mt-auto truncate pt-2 text-[11px] text-white/70 tabular-nums">
            {Math.round(pct * 100)}% · {plural(book.media.pagesCount, 'page')}
          </p>
        </div>
        <div className="absolute right-3 bottom-3 flex size-7 items-center justify-center rounded-full bg-accent text-accent-ink opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
          <Play className="size-3.5" weight="fill" />
        </div>
      </div>

      {/* pinned to the card's bottom edge so the hover play button can never collide with it */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
        <div className="h-full bg-accent" style={{ width: `${Math.max(pct * 100, 4)}%` }} />
      </div>
    </Link>
  )
}
