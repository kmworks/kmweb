import type { BookDto } from '@/lib/api/types'
import { urls } from '@/lib/utils/urls'
import { useBust } from '@/lib/store/thumbnails'
import { useUiStore } from '@/lib/store/ui'
import { CoverImage } from './CoverImage'
import { CardFrame, CardText, CardOverlayText } from './CardFrame'
import { ProgressCapsule } from './badges'
import { plural } from '@/lib/utils/format'

interface BookCardProps {
  book: BookDto
  className?: string
  /** show the series title as secondary line (useful outside series context) */
  showSeries?: boolean
  eager?: boolean
}

export function BookCard({ book, className, showSeries, eager }: BookCardProps) {
  const bust = useBust(book.id)
  const blurUnread = useUiStore((s) => s.blurUnreadCovers)
  const title = book.metadata.title || book.name
  const unread = !book.readProgress

  const secondary = showSeries
    ? book.seriesTitle
    : `#${book.metadata.number} · ${plural(book.media.pagesCount, 'page')}`

  const progress = book.readProgress && !book.readProgress.completed && book.media.pagesCount > 0
    ? book.readProgress.page / book.media.pagesCount
    : 0

  return (
    <CardFrame to={`/book/${book.id}`} label={title} className={className}>
      <div className="relative">
        <CoverImage
          src={urls.bookThumbnail(book.id, bust || undefined)}
          alt={title}
          eager={eager}
          blurred={blurUnread && unread}
        />
        <ProgressCapsule value={progress} />
        <CardOverlayText title={title} secondary={secondary} />
      </div>
      <CardText title={title} secondary={secondary} />
    </CardFrame>
  )
}
