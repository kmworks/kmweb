import { useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ApiKeysSection } from '@/components/account/ApiKeysSection'

export function AccountApiKeysPage() {
  useEffect(() => {
    document.title = 'API keys · KMReader'
  }, [])

  return (
    <div className="max-w-3xl">
      <PageHeader title="API keys" subtitle="Keys for third-party clients and sync" />
      <ApiKeysSection />
    </div>
  )
}
