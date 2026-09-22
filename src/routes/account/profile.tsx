import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { PageHeader } from '@/components/ui/PageHeader'
import { AboutSection } from '@/components/account/AboutSection'
import { ProfileSection } from '@/components/account/ProfileSection'

export function AccountProfilePage() {
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    document.title = 'Profile · KMReader'
  }, [])

  return (
    <div className="max-w-3xl">
      <PageHeader title="Profile" subtitle={user?.email} />
      <div className="space-y-6">
        <ProfileSection />
        <AboutSection />
      </div>
    </div>
  )
}
