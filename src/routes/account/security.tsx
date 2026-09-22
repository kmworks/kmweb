import { useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ActivitySection } from '@/components/account/ActivitySection'
import { PasswordSection } from '@/components/account/PasswordSection'

export function AccountSecurityPage() {
  useEffect(() => {
    document.title = 'Security · KMReader'
  }, [])

  return (
    <div className="max-w-3xl">
      <PageHeader title="Security" subtitle="Password and login activity" />
      <div className="space-y-6">
        <PasswordSection />
        <ActivitySection />
      </div>
    </div>
  )
}
