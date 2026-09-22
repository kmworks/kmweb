import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { KnownTab } from '@/components/admin/page-hashes/KnownTab'
import { UnknownTab } from '@/components/admin/page-hashes/UnknownTab'

type Tab = 'known' | 'unknown'

export function AdminDuplicatePagesPage() {
  const [tab, setTab] = useState<Tab>('known')

  useEffect(() => {
    document.title = 'Duplicate pages · KMReader'
  }, [])

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Duplicate pages"
        subtitle="Review pages that appear in many books, like credit pages or ads, and decide what happens to them"
        actions={
          <SegmentedControl
            options={[
              { value: 'known', label: 'Known' },
              { value: 'unknown', label: 'Unknown' },
            ]}
            value={tab}
            onChange={setTab}
          />
        }
      />
      {tab === 'known' ? <KnownTab /> : <UnknownTab />}
    </div>
  )
}
