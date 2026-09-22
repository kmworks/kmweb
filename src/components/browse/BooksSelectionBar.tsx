import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Checks, DotsThreeVertical, ListPlus, PencilSimple, Trash } from '@phosphor-icons/react'
import { booksApi } from '@/lib/api/books'
import { isAdmin, useAuthStore } from '@/lib/store/auth'
import { plural } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import type { Selection } from '@/components/selection/useSelection'
import { useBatchRun } from '@/components/selection/useBatchRun'
import { SelectionBar } from './SelectionBar'
import { AddToReadListDialog } from './AddToReadListDialog'
import { ConfirmDeleteFilesDialog } from './ConfirmDeleteFilesDialog'
import { EditBooksDialog } from '@/components/metadata/EditBooksDialog'

interface BooksSelectionBarProps {
  selection: Selection
  /** ids of the books currently loaded in the grid; "Select all" covers these */
  loadedIds: string[]
}

export function BooksSelectionBar({ selection, loadedIds }: BooksSelectionBarProps) {
  const queryClient = useQueryClient()
  const admin = isAdmin(useAuthStore((s) => s.user))
  const { state, run, setResult, reset } = useBatchRun()
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const busy = state.status === 'running'
  const ids = selection.ids

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['books'] })
    queryClient.invalidateQueries({ queryKey: ['series'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['readlists'] })
  }

  // after a successful run the bar lingers briefly so the result message reads, then the selection clears
  useEffect(() => {
    if (state.status !== 'success') return
    const t = setTimeout(() => {
      selection.clear()
      reset()
    }, 2200)
    return () => clearTimeout(t)
  }, [state.status, selection, reset])

  const mark = (read: boolean) => {
    const noun = plural(ids.length, 'book')
    void run(ids, (id) => (read ? booksApi.markRead(id) : booksApi.markUnread(id)), {
      success: (n) => `Marked ${plural(n, 'book')} as ${read ? 'read' : 'unread'}`,
      failure: (f) => `${f} of ${noun} failed`,
    }).then((failed) => {
      if (failed < ids.length) invalidate()
    })
  }

  const deleteFiles = () => {
    setDeleteOpen(false)
    void run(ids, (id) => booksApi.deleteFile(id), {
      success: (n) => `Deleted files for ${plural(n, 'book')}`,
      failure: (f, n) => `${f} of ${n} failed`,
    }).then((failed) => {
      if (failed < ids.length) invalidate()
    })
  }

  return (
    <>
      <SelectionBar
        count={selection.size}
        loaded={loadedIds.length}
        state={state}
        onSelectAll={() => selection.selectAll(loadedIds)}
        onClear={() => {
          selection.clear()
          reset()
        }}
        onDismiss={reset}
      >
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => mark(true)}>
          <Checks className="size-4" />
          Mark read
        </Button>
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => mark(false)}>
          Mark unread
        </Button>
        <Menu
          side="top"
          trigger={
            <IconButton label="More actions" className="size-8">
              <DotsThreeVertical className="size-4.5" />
            </IconButton>
          }
        >
          <MenuItem onSelect={() => setAddOpen(true)}>
            <ListPlus className="size-4" /> Add to read list
          </MenuItem>
          <MenuItem onSelect={() => setEditOpen(true)}>
            <PencilSimple className="size-4" /> Edit metadata
          </MenuItem>
          {admin && (
            <>
              <MenuSeparator />
              <MenuItem danger onSelect={() => setDeleteOpen(true)}>
                <Trash className="size-4" /> Delete files
              </MenuItem>
            </>
          )}
        </Menu>
      </SelectionBar>

      <AddToReadListDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        bookIds={ids}
        onDone={(ok, message) => setResult(ok ? 'success' : 'error', message)}
      />
      <EditBooksDialog open={editOpen} onClose={() => setEditOpen(false)} bookIds={ids} />
      <ConfirmDeleteFilesDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        count={ids.length}
        noun={plural(ids.length, 'book')}
        loading={busy}
        onConfirm={deleteFiles}
      />
    </>
  )
}
