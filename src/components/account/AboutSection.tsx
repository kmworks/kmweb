import { useQuery } from '@tanstack/react-query'
import { serverApi } from '@/lib/api/users'
import { Section } from './Section'

export function AboutSection() {
  const { data: info } = useQuery({ queryKey: ['server-info'], queryFn: serverApi.info, staleTime: Infinity })
  return (
    <Section title="About">
      <p className="text-sm text-ink-3">kmrs{info?.build?.version ? ` ${info.build.version}` : ''}</p>
    </Section>
  )
}
