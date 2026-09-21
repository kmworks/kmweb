import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api/settings'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { SettingsForm } from '@/components/admin/settings/SettingsForm'

export function AdminSettingsPage() {
  const query = useQuery({ queryKey: ['admin', 'settings'], queryFn: settingsApi.get })

  useEffect(() => {
    document.title = 'Settings · KMReader'
  }, [])

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Server-wide options, stored in the database" />
      {query.isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      )}
      {query.isError && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-5">
          <p className="text-sm text-danger">
            {query.error instanceof Error ? query.error.message : 'Could not load settings.'}
          </p>
          <Button size="sm" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      )}
      {query.data && <SettingsForm settings={query.data} />}
    </div>
  )
}
