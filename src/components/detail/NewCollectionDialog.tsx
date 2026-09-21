import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collectionsApi } from '@/lib/api/collections'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import { Button } from '@/components/ui/Button'

interface NewCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  seriesId: string
}

export function NewCollectionDialog({ open, onOpenChange, seriesId }: NewCollectionDialogProps) {
  const [name, setName] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (open) setName('')
  }, [open])

  const createMutation = useMutation({
    mutationFn: () => collectionsApi.create({ name: name.trim(), ordered: false, seriesIds: [seriesId] }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      onOpenChange(false)
      navigate(`/collections/${created.id}`)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="New collection" size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) createMutation.mutate()
        }}
        className="px-5 py-4"
      >
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Collection name"
          autoFocus
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={createMutation.isPending} disabled={!name.trim()}>
            Create
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
