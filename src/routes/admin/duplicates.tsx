import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, WarningCircle } from '@phosphor-icons/react'
import { booksApi } from '@/lib/api/books'
import { librariesApi } from '@/lib/api/libraries'
import type { BookDto } from '@/lib/api/types'
import { plural } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { DeleteBookFileDialog } from '@/components/admin/duplicates/DeleteBookFileDialog'
import { DuplicateGroup } from '@/components/admin/duplicates/DuplicateGroup'

export function AdminDuplicatesPage() {
  const [deleting, setDeleting] = useState<BookDto | null>(null)

  useEffect(() => {
    document.title = 'Duplicates · KMReader'
  }, [])

  // unpaged: groups can span pages, so grouping must happen on the full set
  const q = useQuery({
    queryKey: ['admin', 'duplicates'],
    queryFn: () => booksApi.duplicates({ unpaged: true }),
  })
  const librariesQuery = useQuery({ queryKey: ['libraries'], queryFn: librariesApi.list })

  const groups = useMemo(() => {
    const byHash = new Map<string, BookDto[]>()
    for (const b of q.data?.content ?? []) {
      const list = byHash.get(b.fileHash) ?? []
      list.push(b)
      byHash.set(b.fileHash, list)
    }
    return [...byHash.entries()]
      .filter(([, books]) => books.length > 1)
      .sort((a, b) => b[1].length * b[1][0].sizeBytes - a[1].length * a[1][0].sizeBytes)
  }, [q.data])

  const bookCount = groups.reduce((n, [, books]) => n + books.length, 0)

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Duplicates"
        subtitle={
          q.data
            ? `${plural(groups.length, 'group')} · ${plural(bookCount, 'book')} sharing identical files`
            : 'Books sharing identical files'
        }
      />

      {q.isPending ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : q.isError ? (
        <EmptyState
          icon={<WarningCircle />}
          title="Couldn't load duplicates"
          body={q.error instanceof Error ? q.error.message : 'Something went wrong.'}
          action={<Button onClick={() => q.refetch()}>Retry</Button>}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Copy />}
          title="No duplicate books"
          body="Every file in your libraries is unique."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(([hash, books]) => (
            <DuplicateGroup
              key={hash}
              fileHash={hash}
              books={books}
              libraries={librariesQuery.data ?? []}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <DeleteBookFileDialog
        book={deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null)
        }}
      />
    </div>
  )
}
