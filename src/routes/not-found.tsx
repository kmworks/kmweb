import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Compass } from '@phosphor-icons/react'

export function NotFoundPage() {
  return (
    <EmptyState
      className="py-32"
      icon={<Compass />}
      title="Page not found"
      body="The page you are looking for does not exist or has moved."
      action={
        <Link to="/dashboard">
          <Button variant="primary">Back to dashboard</Button>
        </Link>
      }
    />
  )
}
