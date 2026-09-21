import { useMutation, useQueryClient } from '@tanstack/react-query'
import { librariesApi } from '@/lib/api/libraries'
import type { LibraryDto } from '@/lib/api/types'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'

interface DeleteLibraryDialogProps {
  library: LibraryDto | null
  onOpenChange: (open: boolean) => void
}

export function DeleteLibraryDialog({ library, onOpenChange }: DeleteLibraryDialogProps) {
  const queryClient = useQueryClient()
  const del = useMutation({
    mutationFn: (id: string) => librariesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['libraries'] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={!!library} onOpenChange={onOpenChange} title="Delete library" size="sm">
      <div className="px-5 py-4">
        <p className="text-sm text-ink-2">
          Delete <span className="font-medium text-ink">{library?.name}</span>? This removes the library and all its
          series and books from kmrs. Files on disk are not deleted.
        </p>
        {del.isError && (
          <p className="mt-3 text-[13px] text-danger">
            {del.error instanceof Error ? del.error.message : 'Could not delete the library.'}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" variant="danger" loading={del.isPending} onClick={() => library && del.mutate(library.id)}>
          Delete
        </Button>
      </div>
    </Dialog>
  )
}
