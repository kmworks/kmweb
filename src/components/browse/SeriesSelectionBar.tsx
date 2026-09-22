import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Checks, DotsThreeVertical, FolderPlus, PencilSimple, Trash } from '@phosphor-icons/react'
import { seriesApi } from '@/lib/api/series'
import { isAdmin, useAuthStore } from '@/lib/store/auth'
import { plural } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import type { Selection } from '@/components/selection/useSelection'
import { useBatchRun } from '@/components/selection/useBatchRun'
import { SelectionBar } from './SelectionBar'
import { AddToCollectionDialog } from './AddToCollectionDialog'
import { ConfirmDeleteFilesDialog } from './ConfirmDeleteFilesDialog'
import { EditSeriesDialog } from '@/components/metadata/EditSeriesDialog'

interface SeriesSelectionBarProps {
  selection: Selection
  /** ids of the series currently loaded in the grid; "Select all" covers these */
  loadedIds: string[]
}

export function SeriesSelectionBar({ selection, loadedIds }: SeriesSelectionBarProps) {
  const queryClient = useQueryClient()
  const admin = isAdmin(useAuthStore((s) => s.user))
  const { state, run, setResult, reset } = useBatchRun()
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const busy = state.status === 'running'
  const ids = selection.ids

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['series'] })
    queryClient.invalidateQueries({ queryKey: ['books'] })
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
    const noun = plural(ids.length, 'series', 'series')
    void run(ids, (id) => (read ? seriesApi.markRead(id) : seriesApi.markUnread(id)), {
      success: (n) => `Marked ${plural(n, 'series', 'series')} as ${read ? 'read' : 'unread'}`,
      failure: (f) => `${f} of ${noun} failed`,
    }).then((failed) => {
      if (failed < ids.length) invalidate()
    })
  }

  const deleteFiles = () => {
    setDeleteOpen(false)
    void run(ids, (id) => seriesApi.deleteFile(id), {
      success: (n) => `Deleted files for ${plural(n, 'series', 'series')}`,
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
            <FolderPlus className="size-4" /> Add to collection
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

      <AddToCollectionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        seriesIds={ids}
        onDone={(ok, message) => setResult(ok ? 'success' : 'error', message)}
      />
      <EditSeriesDialog open={editOpen} onClose={() => setEditOpen(false)} seriesIds={ids} />
      <ConfirmDeleteFilesDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        count={ids.length}
        noun={plural(ids.length, 'series', 'series')}
        loading={busy}
        onConfirm={deleteFiles}
      />
    </>
  )
}
