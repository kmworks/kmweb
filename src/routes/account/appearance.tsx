import { useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { AppearanceSection } from '@/components/account/AppearanceSection'

export function AccountAppearancePage() {
  useEffect(() => {
    document.title = 'Appearance · KMReader'
  }, [])

  return (
    <div className="max-w-3xl">
      <PageHeader title="Appearance" subtitle="Theme and library cards" />
      <AppearanceSection />
    </div>
  )
}
