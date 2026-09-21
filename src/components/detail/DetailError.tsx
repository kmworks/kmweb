import { ApiError } from '@/lib/api/client'
import { Compass, Warning } from '@phosphor-icons/react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

interface DetailErrorProps {
  error: unknown
  notFoundTitle: string
  onRetry: () => void
}

export function DetailError({ error, notFoundTitle, onRetry }: DetailErrorProps) {
  if (error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState
        className="py-32"
        icon={<Compass />}
        title={notFoundTitle}
        body="It may have been deleted, or you do not have access to it."
      />
    )
  }
  return (
    <EmptyState
      className="py-32"
      icon={<Warning />}
      title="Something went wrong"
      body={error instanceof Error ? error.message : 'Unknown error'}
      action={
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      }
    />
  )
}
