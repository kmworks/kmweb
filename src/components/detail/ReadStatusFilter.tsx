import { SegmentedControl } from '@/components/ui/SegmentedControl'

export type ReadStatusFilter = 'ALL' | 'UNREAD' | 'IN_PROGRESS' | 'READ'

const options: Array<{ value: ReadStatusFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'UNREAD', label: 'Unread' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'READ', label: 'Read' },
]

export function ReadStatusFilterControl({
  value,
  onChange,
  className,
}: {
  value: ReadStatusFilter
  onChange: (v: ReadStatusFilter) => void
  className?: string
}) {
  return <SegmentedControl options={options} value={value} onChange={onChange} size="sm" className={className} />
}
