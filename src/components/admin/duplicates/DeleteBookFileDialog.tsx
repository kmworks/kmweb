import { useMutation, useQueryClient } from '@tanstack/react-query'
import { booksApi } from '@/lib/api/books'
import type { BookDto } from '@/lib/api/types'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'

interface DeleteBookFileDialogProps {
  book: BookDto | null
  onOpenChange: (open: boolean) => void
}

export function DeleteBookFileDialog({ book, onOpenChange }: DeleteBookFileDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (bookId: string) => booksApi.deleteFile(bookId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'duplicates'] })
      void queryClient.invalidateQueries({ queryKey: ['books'] })
      onOpenChange(false)
    },
  })

  const close = () => {
    mutation.reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={!!book}
      onOpenChange={(o) => {
        if (!o) close()
      }}
      title="Delete file"
      size="sm"
    >
      <div className="px-5 py-4">
        <p className="text-sm text-ink-2">
          Delete the file for <span className="font-medium text-ink">{book?.metadata.title || book?.name}</span>? The
          file is permanently removed from disk. Make sure one copy of this book stays behind.
        </p>
        {mutation.isError && (
          <p className="mt-3 text-sm text-danger">
            {mutation.error instanceof Error ? mutation.error.message : 'Could not delete the file.'}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button variant="danger" loading={mutation.isPending} onClick={() => book && mutation.mutate(book.id)}>
          Delete file
        </Button>
      </div>
    </Dialog>
  )
}
