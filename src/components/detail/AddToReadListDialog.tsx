import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { readlistsApi } from '@/lib/api/collections'
import { booksApi } from '@/lib/api/books'
import type { ReadListDto } from '@/lib/api/types'
import { plural } from '@/lib/utils/format'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Skeleton } from '@/components/ui/Skeleton'

interface AddToReadListDialogProps {
  bookId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddToReadListDialog({ bookId, open, onOpenChange }: AddToReadListDialogProps) {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')

  const listsQuery = useQuery({
    queryKey: ['readlists', 'all'],
    queryFn: () => readlistsApi.list({ size: 100 }),
    enabled: open,
  })
  const membershipQuery = useQuery({
    queryKey: ['readlists', 'book', bookId],
    queryFn: () => booksApi.readlists(bookId),
    enabled: open,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ list, add }: { list: ReadListDto; add: boolean }) =>
      readlistsApi.update(list.id, {
        bookIds: add ? [...list.bookIds, bookId] : list.bookIds.filter((id) => id !== bookId),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['readlists'] }),
  })

  const createMutation = useMutation({
    mutationFn: () => readlistsApi.create({ name: newName.trim(), summary: '', ordered: false, bookIds: [bookId] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readlists'] })
      setNewName('')
    },
  })

  const lists = listsQuery.data?.content ?? []
  const memberIds = new Set((membershipQuery.data ?? []).map((l) => l.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Add to read list" size="sm">
      <div className="py-2">
        {listsQuery.isPending ? (
          <div className="space-y-3 px-5 py-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        ) : lists.length === 0 ? (
          <p className="px-5 py-3 text-sm text-ink-3">No read lists yet</p>
        ) : (
          lists.map((list) => (
            <div key={list.id} className="flex items-center justify-between gap-3 px-5 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">{list.name}</p>
                <p className="text-xs text-ink-3">{plural(list.bookIds.length, 'book')}</p>
              </div>
              <Switch
                checked={memberIds.has(list.id)}
                onCheckedChange={(add) => toggleMutation.mutate({ list, add })}
                label={list.name}
                disabled={toggleMutation.isPending}
              />
            </div>
          ))
        )}
      </div>
      <div className="border-t border-line px-5 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (newName.trim()) createMutation.mutate()
          }}
          className="flex items-end gap-2"
        >
          <TextField
            label="New read list"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="flex-1"
          />
          <Button type="submit" variant="primary" loading={createMutation.isPending} disabled={!newName.trim()}>
            Create
          </Button>
        </form>
      </div>
    </Dialog>
  )
}
