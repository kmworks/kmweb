import type { SeriesDto } from '@/lib/api/types'
import { urls } from '@/lib/utils/urls'
import { useBust } from '@/lib/store/thumbnails'
import { useUiStore } from '@/lib/store/ui'
import { CoverImage } from './CoverImage'
import { CardFrame, CardText, CardOverlayText } from './CardFrame'
import { ProgressCapsule, UnreadBadge } from './badges'
import { SelectBadge } from '@/components/selection/SelectBadge'
import type { CardSelection } from '@/components/selection/useSelection'
import { cn } from '@/lib/utils/cn'

function secondaryLine(series: SeriesDto): string {
  const { booksCount, booksUnreadCount, booksInProgressCount, booksReadCount } = series
  if (booksInProgressCount > 0 && booksCount > 0) {
    return `${Math.round((booksReadCount / booksCount) * 100)}% · ${booksCount} books`
  }
  if (booksUnreadCount > 0) return `${booksUnreadCount} of ${booksCount} unread`
  return `${booksCount} books`
}

interface SeriesCardProps {
  series: SeriesDto
  className?: string
  eager?: boolean
  /** when set, the card shows a selection checkbox and toggles instead of navigating in selection mode */
  selection?: CardSelection
}

export function SeriesCard({ series, className, eager, selection }: SeriesCardProps) {
  const bust = useBust(series.id)
  const blurUnread = useUiStore((s) => s.blurUnreadCovers)
  const title = series.metadata.title || series.name

  const frame = (
    <CardFrame to={`/series/${series.id}`} label={title} className={selection ? undefined : className}>
      <div className="relative">
        <CoverImage
          src={urls.seriesThumbnail(series.id, bust || undefined)}
          alt={title}
          eager={eager}
          blurred={blurUnread && series.booksUnreadCount > 0}
          className={cn(selection?.selected && 'ring-2 ring-accent')}
        />
        {selection && <SelectBadge {...selection} label={title} />}
        <UnreadBadge count={series.booksUnreadCount} />
        <ProgressCapsule
          value={series.booksCount > 0 && series.booksInProgressCount > 0 ? series.booksReadCount / series.booksCount : 0}
        />
        <CardOverlayText title={title} secondary={secondaryLine(series)} />
      </div>
      <CardText title={title} secondary={secondaryLine(series)} />
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

export function CollectionCard({
  id,
  name,
  count,
  className,
}: {
  id: string
  name: string
  count: number
  className?: string
}) {
  const bust = useBust(id)
  return (
    <CardFrame to={`/collections/${id}`} label={name} className={className}>
      <div className={cn('relative')}>
        <CoverImage src={urls.collectionThumbnail(id, bust || undefined)} alt={name} />
        <CardOverlayText title={name} secondary={`${count} series`} />
      </div>
      <CardText title={name} secondary={`${count} series`} />
    </CardFrame>
  )
}

export function ReadListCard({
  id,
  name,
  count,
  className,
}: {
  id: string
  name: string
  count: number
  className?: string
}) {
  const bust = useBust(id)
  return (
    <CardFrame to={`/readlists/${id}`} label={name} className={className}>
      <div className="relative">
        <CoverImage src={urls.readlistThumbnail(id, bust || undefined)} alt={name} />
        <CardOverlayText title={name} secondary={`${count} books`} />
      </div>
      <CardText title={name} secondary={`${count} books`} />
    </CardFrame>
  )
}
