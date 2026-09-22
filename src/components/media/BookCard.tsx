import type { BookDto } from '@/lib/api/types'
import { urls } from '@/lib/utils/urls'
import { useBust } from '@/lib/store/thumbnails'
import { useUiStore } from '@/lib/store/ui'
import { CoverImage } from './CoverImage'
import { CardFrame, CardText, CardOverlayText } from './CardFrame'
import { ProgressCapsule } from './badges'
import { SelectBadge } from '@/components/selection/SelectBadge'
import type { CardSelection } from '@/components/selection/useSelection'
import { plural } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface BookCardProps {
  book: BookDto
  className?: string
  /** show the series title as secondary line (useful outside series context) */
  showSeries?: boolean
  eager?: boolean
  /** when set, the card shows a selection checkbox and toggles instead of navigating in selection mode */
  selection?: CardSelection
}

export function BookCard({ book, className, showSeries, eager, selection }: BookCardProps) {
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

  const frame = (
    <CardFrame to={`/book/${book.id}`} label={title} className={selection ? undefined : className}>
      <div className="relative">
        <CoverImage
          src={urls.bookThumbnail(book.id, bust || undefined)}
          alt={title}
          eager={eager}
          blurred={blurUnread && unread}
          className={cn(selection?.selected && 'ring-2 ring-accent')}
        />
        {selection && <SelectBadge {...selection} label={title} />}
        <ProgressCapsule value={progress} />
        <CardOverlayText title={title} secondary={secondary} />
      </div>
      <CardText title={title} secondary={secondary} />
    </CardFrame>
  )

  if (!selection) return frame
  // in selection mode the whole card toggles; capture phase so both the badge and the Link see one click
  return (
    <div
      className={cn('rounded-lg', className)}
      onClickCapture={(e) => {
        if (!selection.active) return
        e.preventDefault()
        e.stopPropagation()
        selection.onToggle()
      }}
    >
      {frame}
    </div>
  )
}
