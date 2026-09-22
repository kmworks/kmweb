import { useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ReaderSection } from '@/components/account/ReaderSection'

export function AccountReaderPage() {
  useEffect(() => {
    document.title = 'Reader defaults · KMReader'
  }, [])

  return (
    <div className="max-w-3xl">
      <PageHeader title="Reader" subtitle="Defaults for the comic reader" />
      <ReaderSection />
    </div>
  )
}
