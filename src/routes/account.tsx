import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { PageHeader } from '@/components/ui/PageHeader'
import { AboutSection } from '@/components/account/AboutSection'
import { ActivitySection } from '@/components/account/ActivitySection'
import { ApiKeysSection } from '@/components/account/ApiKeysSection'
import { AppearanceSection } from '@/components/account/AppearanceSection'
import { PasswordSection } from '@/components/account/PasswordSection'
import { ProfileSection } from '@/components/account/ProfileSection'
import { ReaderSection } from '@/components/account/ReaderSection'

export function AccountPage() {
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    document.title = 'Account · kmrs'
  }, [])

  return (
    <div className="max-w-3xl">
      <PageHeader title="Account" subtitle={user?.email} />
      <div className="space-y-6">
        <ProfileSection />
        <PasswordSection />
        <ApiKeysSection />
        <AppearanceSection />
        <ReaderSection />
        <ActivitySection />
        <AboutSection />
      </div>
    </div>
  )
}
