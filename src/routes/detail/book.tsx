import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, BookmarkSimple, BookOpen, Checks, DotsThreeVertical } from '@phosphor-icons/react'
import { booksApi } from '@/lib/api/books'
import { librariesApi } from '@/lib/api/libraries'
import { canDownload, isAdmin, useAuthStore } from '@/lib/store/auth'
import { useBust } from '@/lib/store/thumbnails'
import { urls } from '@/lib/utils/urls'
import { readRoute } from '@/lib/utils/nav'
import { formatBytes, formatDate, relativeTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import { CoverImage } from '@/components/media/CoverImage'
import { ReadListCard } from '@/components/media/SeriesCard'
import { HorizontalRow } from '@/components/media/HorizontalRow'
import { DetailHero } from '@/components/detail/DetailHero'
import { DetailSkeleton } from '@/components/detail/DetailSkeleton'
import { DetailError } from '@/components/detail/DetailError'
import { Summary } from '@/components/detail/Summary'
import { DownloadLink } from '@/components/detail/DownloadLink'
import { AddToReadListDialog } from '@/components/detail/AddToReadListDialog'

function Field({ term, mono, children }: { term: string; mono?: boolean; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-ink-3 uppercase">{term}</dt>
      <dd className={cn('mt-1 text-sm text-ink', mono && 'font-mono')}>{children}</dd>
    </div>
  )
}

export function BookDetailPage() {
  const { bookId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const bust = useBust(bookId)
  const [addToListOpen, setAddToListOpen] = useState(false)

  const bookQuery = useQuery({ queryKey: ['books', bookId], queryFn: () => booksApi.get(bookId) })
  const book = bookQuery.data

  const librariesQuery = useQuery({ queryKey: ['libraries'], queryFn: librariesApi.list })
  // siblings 404 when there is none; the query client does not retry 404s
  const previousQuery = useQuery({
    queryKey: ['books', bookId, 'previous'],
    queryFn: () => booksApi.previous(bookId),
    enabled: !!book,
  })
  const nextQuery = useQuery({
    queryKey: ['books', bookId, 'next'],
    queryFn: () => booksApi.next(bookId),
    enabled: !!book,
  })
  const readlistsQuery = useQuery({
    queryKey: ['readlists', 'book', bookId],
    queryFn: () => booksApi.readlists(bookId),
    enabled: !!book,
  })

  const markMutation = useMutation({
    mutationFn: (read: boolean) => (read ? booksApi.markRead(bookId) : booksApi.markUnread(bookId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['series'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['readlists'] })
    },
  })

  const title = book ? book.metadata.title || book.name : ''
  useEffect(() => {
    document.title = title ? `${title} · kmrs` : 'kmrs'
  }, [title])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [bookId])

  if (bookQuery.isPending) return <DetailSkeleton />
  if (bookQuery.error)
    return <DetailError error={bookQuery.error} notFoundTitle="Book not found" onRetry={() => bookQuery.refetch()} />
  if (!book) return null

  const library = librariesQuery.data?.find((l) => l.id === book.libraryId)
  const md = book.metadata
  const progress = book.readProgress
  const completed = !!progress?.completed
  const route = readRoute(book)
  const prev = previousQuery.data ?? null
  const next = nextQuery.data ?? null
  const readlists = readlistsQuery.data ?? []
  const cover = urls.bookThumbnail(book.id, bust || undefined)
  const authorsLine = md.authors.map((a) => `${a.name} (${a.role})`).join(', ')
  const progressPct = completed ? 100 : book.media.pagesCount > 0 && progress ? (progress.page / book.media.pagesCount) * 100 : 0

  return (
    <div>
      <DetailHero backdrop={cover}>
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
          <p className="mt-1.5 text-ink-2">
            <Link to={`/series/${book.seriesId}`} className="transition-colors hover:text-accent-strong">
              {book.seriesTitle}
            </Link>
            {' · '}
            <span className="font-mono">#{md.number}</span>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="primary" disabled={!route} onClick={() => route && navigate(route)}>
              <BookOpen className="size-4" />
              {progress && !progress.completed ? `Continue · page ${progress.page}` : 'Read'}
            </Button>
            <Button variant="secondary" loading={markMutation.isPending} onClick={() => markMutation.mutate(!completed)}>
              {!completed && <Checks className="size-4" />}
              {completed ? 'Mark as unread' : 'Mark as read'}
            </Button>
            {canDownload(user) && <DownloadLink href={urls.bookFile(book.id)} />}
            {(isAdmin(user) || prev || next) && (
              <Menu
                trigger={
                  <IconButton label="More actions">
                    <DotsThreeVertical className="size-5" />
                  </IconButton>
                }
              >
                {isAdmin(user) && (
                  <MenuItem onSelect={() => setAddToListOpen(true)}>
                    <BookmarkSimple className="size-4" /> Add to read list
                  </MenuItem>
                )}
                {isAdmin(user) && (prev || next) && <MenuSeparator />}
                {prev && (
                  <MenuItem onSelect={() => navigate(`/book/${prev.id}`)}>
                    <ArrowLeft className="size-4" /> Previous book
                  </MenuItem>
                )}
                {next && (
                  <MenuItem onSelect={() => navigate(`/book/${next.id}`)}>
                    <ArrowRight className="size-4" /> Next book
                  </MenuItem>
                )}
              </Menu>
            )}
          </div>
          {!route && <p className="mt-2 text-xs text-ink-3">EPUB books are not supported by the web reader yet</p>}
        </div>
      </DetailHero>

      {md.summary && <Summary text={md.summary} className="mt-6" />}

      <section className="mt-8 rounded-xl border border-line bg-surface p-5">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <Field term="Pages" mono>
            {book.media.pagesCount}
          </Field>
          <Field term="Size" mono>
            {formatBytes(book.sizeBytes)}
          </Field>
          <Field term="Format">{book.media.mediaType}</Field>
          <Field term="Profile">{book.media.mediaProfile}</Field>
          {md.releaseDate && <Field term="Release date">{formatDate(md.releaseDate)}</Field>}
          {md.isbn && (
            <Field term="ISBN" mono>
              {md.isbn}
            </Field>
          )}
          {authorsLine && <Field term="Authors">{authorsLine}</Field>}
          <Field term="Added">{formatDate(book.created)}</Field>
        </dl>

        {md.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {md.tags.map((t) => (
              <Chip key={t} to={`/books?tags=${encodeURIComponent(t)}`}>
                {t}
              </Chip>
            ))}
          </div>
        )}

        {progress && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-sm text-ink-2">
              {completed ? 'Completed' : `Page ${progress.page} of ${book.media.pagesCount}`}
              {progress.readDate && <span className="text-ink-3"> · {relativeTime(progress.readDate)}</span>}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-overlay">
              <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
      </section>

      {readlists.length > 0 && (
        <HorizontalRow title="In read lists" className="mt-10">
          {readlists.map((l) => (
            <ReadListCard key={l.id} id={l.id} name={l.name} count={l.bookIds.length} className="w-[140px] shrink-0" />
          ))}
        </HorizontalRow>
      )}

      {(prev || next) && (
        <nav className="mt-10 grid grid-cols-2 gap-4 border-t border-line pt-6">
          <div className="min-w-0">
            {prev && (
              <Link to={`/book/${prev.id}`} className="group inline-block max-w-full">
                <span className="flex items-center gap-1 text-xs tracking-wide text-ink-3 uppercase">
                  <ArrowLeft className="size-3.5" /> Previous
                </span>
                <span className="mt-1 block truncate text-sm text-ink transition-colors group-hover:text-accent-strong">
                  #{prev.metadata.number} {prev.metadata.title || prev.name}
                </span>
              </Link>
            )}
          </div>
          <div className="min-w-0 text-right">
            {next && (
              <Link to={`/book/${next.id}`} className="group inline-block max-w-full">
                <span className="flex items-center justify-end gap-1 text-xs tracking-wide text-ink-3 uppercase">
                  Next <ArrowRight className="size-3.5" />
                </span>
                <span className="mt-1 block truncate text-sm text-ink transition-colors group-hover:text-accent-strong">
                  #{next.metadata.number} {next.metadata.title || next.name}
                </span>
              </Link>
            )}
          </div>
        </nav>
      )}

      <AddToReadListDialog bookId={book.id} open={addToListOpen} onOpenChange={setAddToListOpen} />
    </div>
  )
}
