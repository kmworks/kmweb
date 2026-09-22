import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'

interface ConfirmDeleteFilesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  /** e.g. "series" / "books" */
  noun: string
  loading: boolean
  onConfirm: () => void
}

export function ConfirmDeleteFilesDialog({ open, onOpenChange, count, noun, loading, onConfirm }: ConfirmDeleteFilesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Delete files" size="sm">
      <div className="px-5 py-4">
        <p className="text-sm text-ink-2">
          Delete the files of <span className="font-medium text-ink">{count}</span> {noun}? Files are removed from disk. This
          cannot be undone.
        </p>
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>
          Delete files
        </Button>
      </div>
    </Dialog>
  )
}
