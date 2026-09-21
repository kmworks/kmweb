import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowSquareOut, BookOpen, Checks, CircleNotch, DotsThreeVertical, Plus } from '@phosphor-icons/react'
import { seriesApi } from '@/lib/api/series'
import { librariesApi } from '@/lib/api/libraries'
import { canDownload, isAdmin, useAuthStore } from '@/lib/store/auth'
import { useBust } from '@/lib/store/thumbnails'
import { urls } from '@/lib/utils/urls'
import { readRoute } from '@/lib/utils/nav'
import { readingDirectionLabel, seriesStatusLabel } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { IconButton } from '@/components/ui/IconButton'
import { BackButton } from '@/components/ui/BackButton'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { EmptyState } from '@/components/ui/EmptyState'
import { GridSkeleton } from '@/components/ui/Skeleton'
import { CoverImage } from '@/components/media/CoverImage'
import { MediaGrid } from '@/components/media/MediaGrid'
import { BookCard } from '@/components/media/BookCard'
import { CollectionCard } from '@/components/media/SeriesCard'
import { HorizontalRow } from '@/components/media/HorizontalRow'
import { DetailHero } from '@/components/detail/DetailHero'
import { DetailSkeleton } from '@/components/detail/DetailSkeleton'
import { DetailError } from '@/components/detail/DetailError'
import { Summary } from '@/components/detail/Summary'
import { DownloadLink } from '@/components/detail/DownloadLink'
import { NewCollectionDialog } from '@/components/detail/NewCollectionDialog'
import { ReadStatusFilterControl, type ReadStatusFilter } from '@/components/detail/ReadStatusFilter'
import { useSentinel } from '@/components/detail/useSentinel'

const PAGE_SIZE = 48

export function SeriesDetailPage() {
  const { seriesId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const bust = useBust(seriesId)
  const [readStatus, setReadStatus] = useState<ReadStatusFilter>('ALL')
  const [newCollectionOpen, setNewCollectionOpen] = useState(false)

  const seriesQuery = useQuery({ queryKey: ['series', seriesId], queryFn: () => seriesApi.get(seriesId) })
  const series = seriesQuery.data

  const librariesQuery = useQuery({ queryKey: ['libraries'], queryFn: librariesApi.list })
  const collectionsQuery = useQuery({
    queryKey: ['collections', 'series', seriesId],
    queryFn: () => seriesApi.collections(seriesId),
    enabled: !!series,
  })
  // First unread (or in-progress) book, falling back to the first book when fully read
  const readTargetQuery = useQuery({
    queryKey: ['series', seriesId, 'read-target'],
    queryFn: async () => {
      const unread = await seriesApi.books(seriesId, { readStatus: ['UNREAD', 'IN_PROGRESS'], size: 1 })
      if (unread.content[0]) return unread.content[0]
      const first = await seriesApi.books(seriesId, { size: 1 })
      return first.content[0] ?? null
    },
    enabled: !!series,
  })
  const booksQuery = useInfiniteQuery({
    queryKey: ['series', seriesId, 'books', readStatus],
    queryFn: ({ pageParam }) =>
      seriesApi.books(seriesId, {
        page: pageParam,
        size: PAGE_SIZE,
        readStatus: readStatus === 'ALL' ? undefined : [readStatus],
      }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    enabled: !!series,
  })

  const markMutation = useMutation({
    mutationFn: (read: boolean) => (read ? seriesApi.markRead(seriesId) : seriesApi.markUnread(seriesId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['readlists'] })
    },
  })

  const title = series ? series.metadata.title || series.name : ''
  useEffect(() => {
    document.title = title ? `${title} · KMReader` : 'KMReader'
  }, [title])

  const sentinelRef = useSentinel(
    () => {
      if (booksQuery.hasNextPage && !booksQuery.isFetchingNextPage) booksQuery.fetchNextPage()
    },
    !!booksQuery.hasNextPage,
  )

  if (seriesQuery.isPending) return <DetailSkeleton />
  if (seriesQuery.error)
    return <DetailError error={seriesQuery.error} notFoundTitle="Series not found" onRetry={() => seriesQuery.refetch()} />
  if (!series) return null

  const md = series.metadata
  const library = librariesQuery.data?.find((l) => l.id === series.libraryId)
  const allRead = series.booksCount > 0 && series.booksUnreadCount === 0 && series.booksInProgressCount === 0
  const readTarget = readTargetQuery.data
  const readTargetRoute = readTarget ? readRoute(readTarget) : null
  const authorsLine = series.booksMetadata.authors.map((a) => `${a.name} (${a.role})`).join(', ')
  const books = booksQuery.data?.pages.flatMap((p) => p.content) ?? []
  const collections = collectionsQuery.data ?? []
  const cover = urls.seriesThumbnail(series.id, bust || undefined)

  const chips: Array<{ key: string; label: string; to?: string }> = []
  const statusLabel = seriesStatusLabel(md.status)
  if (statusLabel) chips.push({ key: 'status', label: statusLabel, to: `/series?seriesStatus=${md.status}` })
  if (md.publisher)
    chips.push({ key: 'publisher', label: md.publisher, to: `/series?publishers=${encodeURIComponent(md.publisher)}` })
  if (md.language)
    chips.push({ key: 'language', label: md.language, to: `/series?languages=${encodeURIComponent(md.language)}` })
  if (md.ageRating != null)
    chips.push({ key: 'age', label: `${md.ageRating}+`, to: `/series?ageRatings=${md.ageRating}` })
  const directionLabel = readingDirectionLabel(md.readingDirection)
  if (directionLabel) chips.push({ key: 'direction', label: directionLabel })
  for (const g of md.genres) chips.push({ key: `genre-${g}`, label: g, to: `/series?genres=${encodeURIComponent(g)}` })
  for (const t of md.tags) chips.push({ key: `tag-${t}`, label: t, to: `/series?tags=${encodeURIComponent(t)}` })
  for (const s of md.sharingLabels) chips.push({ key: `sharing-${s}`, label: s })

  return (
    <div>
      <DetailHero backdrop={cover} leading={<BackButton to="/series" className="mb-2 -ml-2" />}>
        <CoverImage src={cover} alt={title} eager className="w-36 shrink-0 shadow-card md:w-44" />
        <div className="min-w-0 flex-1">
          {library && (
            <p className="text-xs tracking-wide text-ink-3 uppercase">
              <Link to={`/libraries/${library.id}/series`} className="transition-colors hover:text-accent-strong">
                {library.name}
              </Link>
            </p>
          )}
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h1>
          {authorsLine && <p className="mt-1.5 text-ink-2">{authorsLine}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              disabled={!readTargetRoute}
              loading={readTargetQuery.isPending}
              onClick={() => readTargetRoute && navigate(readTargetRoute)}
            >
              <BookOpen className="size-4" />
              Read
            </Button>
            <Button variant="secondary" loading={markMutation.isPending} onClick={() => markMutation.mutate(!allRead)}>
              {!allRead && <Checks className="size-4" />}
              {allRead ? 'Mark as unread' : 'Mark as read'}
            </Button>
            {canDownload(user) && <DownloadLink href={urls.seriesFile(series.id)} />}
            {isAdmin(user) && (
              <Menu
                trigger={
                  <IconButton label="More actions">
                    <DotsThreeVertical className="size-5" />
                  </IconButton>
                }
              >
                <MenuItem onSelect={() => setNewCollectionOpen(true)}>
                  <Plus className="size-4" /> New collection with this series
                </MenuItem>
              </Menu>
            )}
          </div>
        </div>
      </DetailHero>

      {chips.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <Chip key={c.key} to={c.to}>
              {c.label}
            </Chip>
          ))}
        </div>
      )}

      {md.alternateTitles.length > 0 && (
        <div className="mt-3 space-y-0.5">
          {md.alternateTitles.map((t, i) => (
            <p key={`${t.label}-${i}`} className="text-xs text-ink-3">
              {t.title} ({t.label})
            </p>
          ))}
        </div>
      )}

      {md.links.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {md.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-ink-3 transition-colors hover:text-accent-strong"
            >
              {l.label}
              <ArrowSquareOut className="size-3" />
            </a>
          ))}
        </div>
      )}

      {md.summary && <Summary text={md.summary} className="mt-4" />}

      <p className="mt-4 text-sm text-ink-3">
        <span className="font-mono text-ink-2">{series.booksCount}</span> books
        {' · '}
        <span className="font-mono text-ink-2">{series.booksReadCount}</span> read
        {' · '}
        <span className="font-mono text-ink-2">{series.booksUnreadCount}</span> unread
      </p>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-ink">{series.oneshot ? 'The book' : 'Books'}</h2>
          {!series.oneshot && <ReadStatusFilterControl value={readStatus} onChange={setReadStatus} />}
        </div>
        {booksQuery.isPending ? (
          <GridSkeleton count={6} />
        ) : booksQuery.error ? (
          <EmptyState
            title="Could not load books"
            body={booksQuery.error.message}
            action={
              <Button variant="secondary" onClick={() => booksQuery.refetch()}>
                Retry
              </Button>
            }
          />
        ) : books.length === 0 ? (
          <EmptyState
            title="No books"
            body={readStatus === 'ALL' ? 'This series has no books.' : 'No books match this filter.'}
          />
        ) : series.oneshot ? (
          <BookCard book={books[0]} eager className="w-40" />
        ) : (
          <MediaGrid>
            {books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </MediaGrid>
        )}
        <div ref={sentinelRef} />
        {booksQuery.isFetchingNextPage && (
          <div className="mt-6 flex justify-center">
            <CircleNotch className="size-5 animate-spin text-ink-3" />
          </div>
        )}
      </section>

      {collections.length > 0 && (
        <HorizontalRow title="In collections" className="mt-10">
          {collections.map((c) => (
            <CollectionCard key={c.id} id={c.id} name={c.name} count={c.seriesIds.length} className="w-[140px] shrink-0" />
          ))}
        </HorizontalRow>
      )}

      <NewCollectionDialog open={newCollectionOpen} onOpenChange={setNewCollectionOpen} seriesId={series.id} />
    </div>
  )
}
