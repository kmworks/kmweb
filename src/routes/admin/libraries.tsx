import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Books, Plus, WarningCircle } from '@phosphor-icons/react'
import { librariesApi } from '@/lib/api/libraries'
import type { LibraryDto } from '@/lib/api/types'
import { plural } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { DeleteLibraryDialog } from '@/components/admin/libraries/DeleteLibraryDialog'
import { LibraryCard } from '@/components/admin/libraries/LibraryCard'
import { LibraryDialog } from '@/components/admin/libraries/LibraryDialog'

const GRID_STYLE = { gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }

export function AdminLibrariesPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<LibraryDto | null>(null)
  const [deleting, setDeleting] = useState<LibraryDto | null>(null)

  useEffect(() => {
    document.title = 'Libraries · KMReader'
  }, [])

  const q = useQuery({ queryKey: ['libraries'], queryFn: librariesApi.list })
  const libraries = q.data ?? []

  return (
    <div>
      <PageHeader
        title="Libraries"
        subtitle={
          q.data
            ? `${plural(q.data.length, 'library', 'libraries')} · scan intervals, import sources and analysis options`
            : undefined
        }
        actions={
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add library
          </Button>
        }
      />
      {q.isPending ? (
        <div className="grid gap-4" style={GRID_STYLE}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : q.isError ? (
        <EmptyState
          icon={<WarningCircle />}
          title="Couldn't load libraries"
          body={q.error instanceof Error ? q.error.message : 'Something went wrong.'}
          action={<Button onClick={() => q.refetch()}>Retry</Button>}
        />
      ) : libraries.length === 0 ? (
        <EmptyState
          icon={<Books />}
          title="No libraries yet"
          body="Add a library to start scanning your books."
          action={
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              Add library
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4" style={GRID_STYLE}>
          {libraries.map((lib) => (
            <LibraryCard key={lib.id} library={lib} onEdit={setEditing} onDelete={setDeleting} />
          ))}
        </div>
      )}

      <LibraryDialog open={addOpen} onOpenChange={setAddOpen} />
      {editing && (
        <LibraryDialog
          key={editing.id}
          open
          onOpenChange={(o) => {
            if (!o) setEditing(null)
          }}
          library={editing}
        />
      )}
      <DeleteLibraryDialog
        library={deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null)
        }}
      />
    </div>
  )
}
