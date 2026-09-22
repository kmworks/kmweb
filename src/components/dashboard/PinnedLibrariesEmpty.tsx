import { PushPin } from '@phosphor-icons/react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

export function PinnedLibrariesEmpty({ onManage }: { onManage: () => void }) {
  return (
    <EmptyState
      icon={<PushPin />}
      title="No pinned libraries"
      body="The All dashboard only shows content from your pinned libraries. Pin some to build your dashboard, or reset to see every library again."
      action={
        <Button variant="primary" onClick={onManage}>
          Choose libraries
        </Button>
      }
    />
  )
}
