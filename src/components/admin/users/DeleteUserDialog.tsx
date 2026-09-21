import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/api/users'
import type { UserDto } from '@/lib/api/types'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'

export function DeleteUserDialog({ user, onOpenChange }: { user: UserDto | null; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      // their activity rows are gone too, so the activity table must refetch
      void queryClient.invalidateQueries({ queryKey: ['admin', 'authentication-activity'] })
      onOpenChange(false)
    },
  })

  const close = () => {
    mutation.reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={!!user}
      onOpenChange={(o) => {
        if (!o) close()
      }}
      title="Delete user"
      size="sm"
    >
      <div className="px-5 py-4">
        <p className="text-sm text-ink-2">
          Delete <span className="font-medium text-ink">{user?.email}</span>? Their reading progress, API keys and
          sessions will be permanently removed. This cannot be undone.
        </p>
        {mutation.isError && (
          <p className="mt-3 text-sm text-danger">
            {mutation.error instanceof Error ? mutation.error.message : 'Could not delete the user.'}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button variant="danger" loading={mutation.isPending} onClick={() => user && mutation.mutate(user.id)}>
          Delete
        </Button>
      </div>
    </Dialog>
  )
}
