import { Link } from 'react-router-dom'
import { Play } from '@phosphor-icons/react'
import type { BookDto } from '@/lib/api/types'
import { urls } from '@/lib/utils/urls'
import { readRoute } from '@/lib/utils/nav'
import { useBust } from '@/lib/store/thumbnails'
import { cn } from '@/lib/utils/cn'

/**
 * Apple Books-style resume card: blurred cover as the card background,
 * crisp cover on the left, progress capsule under the text.
 */
export function KeepReadingCard({ book, className }: { book: BookDto; className?: string }) {
  const bust = useBust(book.id)
  const cover = urls.bookThumbnail(book.id, bust || undefined)
  const to = readRoute(book) ?? `/book/${book.id}`
  const pct = book.media.pagesCount > 0 && book.readProgress ? book.readProgress.page / book.media.pagesCount : 0

  return (
    <Link
      to={to}
      aria-label={`Continue reading ${book.metadata.title || book.name}`}
      className={cn(
        'group relative block w-[300px] shrink-0 cursor-pointer overflow-hidden rounded-xl bg-neutral-900',
        'transition-[transform,box-shadow,filter] duration-300 ease-out-expo group-hover:shadow-card group-hover:brightness-[1.07] active:scale-[0.98]',
        className,
      )}
    >
      {/* blurred cover backdrop */}
      <img
        src={cover}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 size-full scale-125 object-cover opacity-40 blur-2xl saturate-[1.2]"
      />
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative flex h-30 items-stretch gap-3.5 p-3.5">
        <img
          src={cover}
          alt={book.metadata.title || book.name}
          loading="lazy"
          draggable={false}
          className="h-full w-auto shrink-0 rounded-md object-cover shadow-[0_2px_10px_rgb(0_0_0/0.5)]"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
          <p className="truncate text-[11px] font-medium tracking-wide text-white/65 uppercase">{book.seriesTitle}</p>
          <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug font-medium text-white">
            {book.metadata.title || book.name}
          </p>
          <div className="mt-auto flex items-center gap-2 pt-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(pct * 100, 4)}%` }} />
            </div>
            <span className="text-[11px] font-medium text-white/70 tabular-nums">{Math.round(pct * 100)}%</span>
          </div>
        </div>
        <div className="absolute right-3 bottom-3 flex size-7 items-center justify-center rounded-full bg-accent text-accent-ink opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
          <Play className="size-3.5" weight="fill" />
        </div>
      </div>
    </Link>
  )
}
