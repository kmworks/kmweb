import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** entity name shown in the confirmation copy */
  name: string
  loading: boolean
  onConfirm: () => void
}

export function ConfirmDeleteDialog({ open, onOpenChange, title, name, loading, onConfirm }: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} size="sm">
      <div className="px-5 py-4">
        <p className="text-sm text-ink-2">
          Delete <span className="font-medium text-ink">{name}</span>? This cannot be undone.
        </p>
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Dialog>
  )
}
