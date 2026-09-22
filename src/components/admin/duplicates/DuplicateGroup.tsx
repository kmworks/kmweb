import { Link } from 'react-router-dom'
import { Trash } from '@phosphor-icons/react'
import type { BookDto, LibraryDto } from '@/lib/api/types'
import { urls } from '@/lib/utils/urls'
import { formatBytes, plural } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'

interface DuplicateGroupProps {
  fileHash: string
  books: BookDto[]
  libraries: LibraryDto[]
  onDelete: (book: BookDto) => void
}

function fileName(url: string): string {
  return url.split('/').pop() || url
}

function Cover({ book }: { book: BookDto }) {
  return (
    <div
      aria-hidden
      className="h-14 w-10 shrink-0 rounded-md bg-raised bg-cover bg-center"
      style={{ backgroundImage: `url(${urls.bookThumbnail(book.id)})` }}
    />
  )
}

export function DuplicateGroup({ fileHash, books, libraries, onDelete }: DuplicateGroupProps) {
  const sizeBytes = books[0]?.sizeBytes ?? 0
  const libraryName = (id: string) => libraries.find((l) => l.id === id)?.name ?? 'Unknown library'

  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line px-4 py-3">
        <code className="max-w-56 truncate font-mono text-xs text-ink-2" title={fileHash}>
          {fileHash}
        </code>
        <span className="text-xs text-ink-3">
          {plural(books.length, 'copy', 'copies')} · {formatBytes(sizeBytes)} each ·{' '}
          {formatBytes(sizeBytes * (books.length - 1))} reclaimable
        </span>
        <span className="ml-auto text-xs text-ink-3">Keep one copy, delete the rest</span>
      </header>
      <ul className="flex flex-col divide-y divide-line">
        {books.map((b) => (
          <li key={b.id} className="flex items-center gap-3 px-4 py-3">
            <Link to={`/book/${b.id}`} className="shrink-0">
              <Cover book={b} />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink">
                <Link to={`/book/${b.id}`} className="hover:text-accent-strong">
                  {b.seriesTitle}
                </Link>
                <span className="text-ink-3"> · {b.metadata.title || b.name}</span>
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-3" title={b.url}>
                {fileName(b.url)}
              </p>
            </div>
            <Chip className="hidden shrink-0 sm:inline-flex">{libraryName(b.libraryId)}</Chip>
            <Button size="sm" variant="danger" onClick={() => onDelete(b)}>
              <Trash className="size-4" />
              Delete file
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
