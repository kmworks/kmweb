import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { serverApi } from '@/lib/api/users'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsGrid } from '@/components/admin/server/StatsGrid'
import { ContentCounts } from '@/components/admin/server/ContentCounts'
import { TaskQueuePanel } from '@/components/admin/server/TaskQueuePanel'
import { TaskExecutionPanel } from '@/components/admin/server/TaskExecutionPanel'
import { ScheduledTasksPanel } from '@/components/admin/server/ScheduledTasksPanel'
import { SessionsPanel } from '@/components/admin/server/SessionsPanel'
import { DangerZone } from '@/components/admin/server/DangerZone'

export function AdminServerPage() {
  const { data: info } = useQuery({ queryKey: ['server-info'], queryFn: serverApi.info, staleTime: Infinity })

  useEffect(() => {
    document.title = 'Server · KMReader'
  }, [])

  const subtitle = info?.build?.version
    ? `kmrs ${info.build.version}${info.git?.commit?.id ? ` · commit ${info.git.commit.id}` : ''}`
    : undefined

  return (
    <div>
      <PageHeader title="Server" subtitle={subtitle} />
      <div className="space-y-6">
        <StatsGrid />
        <ContentCounts />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TaskQueuePanel />
          <TaskExecutionPanel />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ScheduledTasksPanel />
          <SessionsPanel />
        </div>
        <DangerZone />
      </div>
    </div>
  )
}
