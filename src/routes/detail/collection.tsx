import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleNotch, DotsThreeVertical, Image, ListChecks, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { collectionsApi } from '@/lib/api/collections'
import type { CollectionDto } from '@/lib/api/types'
import { isAdmin, useAuthStore } from '@/lib/store/auth'
import { plural } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { BackButton } from '@/components/ui/BackButton'
import { Dialog } from '@/components/ui/Dialog'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import { TextField } from '@/components/ui/TextField'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton, GridSkeleton } from '@/components/ui/Skeleton'
import { MediaGrid } from '@/components/media/MediaGrid'
import { SeriesCard } from '@/components/media/SeriesCard'
import { DetailError } from '@/components/detail/DetailError'
import { ConfirmDeleteDialog } from '@/components/detail/ConfirmDeleteDialog'
import { OrderBadge } from '@/components/detail/OrderBadge'
import { ReadStatusFilterControl, type ReadStatusFilter } from '@/components/detail/ReadStatusFilter'
import { useSentinel } from '@/components/detail/useSentinel'
import { EditCollectionMembers } from '@/components/collections/EditCollectionMembers'
import { SeriesPickerDialog } from '@/components/collections/SeriesPickerDialog'
import { PosterManager } from '@/components/metadata/PosterManager'

const PAGE_SIZE = 48

function RenameCollectionDialog({
  open,
  onOpenChange,
  collection,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: CollectionDto
}) {
  const [name, setName] = useState(collection.name)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (open) setName(collection.name)
  }, [open, collection.name])

  const mutation = useMutation({
    mutationFn: () => collectionsApi.update(collection.id, { name: name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Rename collection" size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) mutation.mutate()
        }}
        className="px-5 py-4"
      >
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={mutation.isPending} disabled={!name.trim()}>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function CollectionDetailPage() {
  const { collectionId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const admin = isAdmin(useAuthStore((s) => s.user))
  const [readStatus, setReadStatus] = useState<ReadStatusFilter>('ALL')
  const [editing, setEditing] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addSeriesOpen, setAddSeriesOpen] = useState(false)
  const [postersOpen, setPostersOpen] = useState(false)

  const collectionQuery = useQuery({
    queryKey: ['collections', collectionId],
    queryFn: () => collectionsApi.get(collectionId),
  })
  const collection = collectionQuery.data

  // kmrs forces the order server-side: collection order when ordered, title otherwise
  const seriesQuery = useInfiniteQuery({
    queryKey: ['collections', collectionId, 'series', readStatus],
    queryFn: ({ pageParam }) =>
      collectionsApi.series(collectionId, {
        page: pageParam,
        size: PAGE_SIZE,
        readStatus: readStatus === 'ALL' ? undefined : [readStatus],
      }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    enabled: !!collection && !editing,
  })

  const deleteMutation = useMutation({
    mutationFn: () => collectionsApi.delete(collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      navigate('/collections')
    },
  })

  const addSeriesMutation = useMutation({
    mutationFn: (ids: string[]) =>
      collectionsApi.update(collectionId, { seriesIds: [...(collection?.seriesIds ?? []), ...ids] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      setAddSeriesOpen(false)
    },
  })

  useEffect(() => {
    document.title = collection ? `${collection.name} · KMReader` : 'KMReader'
  }, [collection])

  const sentinelRef = useSentinel(
    () => {
      if (seriesQuery.hasNextPage && !seriesQuery.isFetchingNextPage) seriesQuery.fetchNextPage()
    },
    !!seriesQuery.hasNextPage,
  )

  if (collectionQuery.isPending)
    return (
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-4 w-20" />
        <GridSkeleton className="mt-8" />
      </div>
    )
  if (collectionQuery.error)
    return (
      <DetailError error={collectionQuery.error} notFoundTitle="Collection not found" onRetry={() => collectionQuery.refetch()} />
    )
  if (!collection) return null

  const allSeries = seriesQuery.data?.pages.flatMap((p) => p.content) ?? []

  return (
    <div>
      <BackButton to="/collections" className="mb-2 -ml-2" />
      <PageHeader
        title={collection.name}
        subtitle={plural(collection.seriesIds.length, 'series', 'series')}
        actions={
          admin &&
          !editing && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setAddSeriesOpen(true)}>
                <Plus className="size-4" /> Add series
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                <ListChecks className="size-4" /> Edit
              </Button>
              <Menu
                trigger={
                  <IconButton label="More actions" className="size-8">
                    <DotsThreeVertical className="size-5" />
                  </IconButton>
                }
              >
                <MenuItem onSelect={() => setPostersOpen(true)}>
                  <Image className="size-4" /> Manage posters
                </MenuItem>
                <MenuItem onSelect={() => setRenameOpen(true)}>
                  <PencilSimple className="size-4" /> Rename
                </MenuItem>
                <MenuSeparator />
                <MenuItem danger onSelect={() => setDeleteOpen(true)}>
                  <Trash className="size-4" /> Delete
                </MenuItem>
              </Menu>
            </>
          )
        }
      />

      {editing ? (
        <EditCollectionMembers collection={collection} onExit={() => setEditing(false)} />
      ) : (
        <>
          <div className="mb-4">
            <ReadStatusFilterControl value={readStatus} onChange={setReadStatus} />
          </div>

          {seriesQuery.isPending ? (
            <GridSkeleton />
          ) : seriesQuery.error ? (
            <EmptyState
              title="Could not load series"
              body={seriesQuery.error.message}
              action={
                <Button variant="secondary" onClick={() => seriesQuery.refetch()}>
                  Retry
                </Button>
              }
            />
          ) : allSeries.length === 0 ? (
            <EmptyState
              title="No series"
              body={readStatus === 'ALL' ? 'This collection is empty.' : 'No series match this filter.'}
            />
          ) : (
            <MediaGrid>
              {allSeries.map((s, i) => (
                <div key={s.id} className="relative">
                  <SeriesCard series={s} />
                  {collection.ordered && <OrderBadge index={i + 1} />}
                </div>
              ))}
            </MediaGrid>
          )}
          <div ref={sentinelRef} />
          {seriesQuery.isFetchingNextPage && (
            <div className="mt-6 flex justify-center">
              <CircleNotch className="size-5 animate-spin text-ink-3" />
            </div>
          )}
        </>
      )}

      <RenameCollectionDialog open={renameOpen} onOpenChange={setRenameOpen} collection={collection} />
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete collection"
        name={collection.name}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
      <SeriesPickerDialog
        open={addSeriesOpen}
        onOpenChange={setAddSeriesOpen}
        title="Add series"
        confirmLabel="Add to collection"
        mode="multi"
        excludeIds={new Set(collection.seriesIds)}
        onConfirm={(selected) => addSeriesMutation.mutate(selected.map((s) => s.id))}
        confirming={addSeriesMutation.isPending}
        error={addSeriesMutation.error?.message}
      />
      <PosterManager
        open={postersOpen}
        onClose={() => setPostersOpen(false)}
        kind="collection"
        entityId={collection.id}
        title={collection.name}
      />
    </div>
  )
}
