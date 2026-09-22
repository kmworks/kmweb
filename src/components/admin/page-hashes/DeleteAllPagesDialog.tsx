import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pageHashesApi } from '@/lib/api/pageHashes'
import type { PageHashKnownDto } from '@/lib/api/types'
import { plural } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'

interface DeleteAllPagesDialogProps {
  known: PageHashKnownDto | null
  onOpenChange: (open: boolean) => void
}

export function DeleteAllPagesDialog({ known, onOpenChange }: DeleteAllPagesDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (hash: string) => pageHashesApi.deleteAll(hash),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'page-hashes'] })
      onOpenChange(false)
    },
  })

  const close = () => {
    mutation.reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={!!known}
      onOpenChange={(o) => {
        if (!o) close()
      }}
      title="Delete all matching pages"
      size="sm"
    >
      <div className="px-5 py-4">
        <p className="text-sm text-ink-2">
          Delete all {plural(known?.matchCount ?? 0, 'page')} matching this hash from their book files? This rewrites
          the files on disk and cannot be undone.
        </p>
        {mutation.isError && (
          <p className="mt-3 text-sm text-danger">
            {mutation.error instanceof Error ? mutation.error.message : 'Could not delete the pages.'}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button variant="danger" loading={mutation.isPending} onClick={() => known && mutation.mutate(known.hash)}>
          Delete all
        </Button>
      </div>
    </Dialog>
  )
}
