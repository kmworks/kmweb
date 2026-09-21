import type { Role } from '@/lib/api/types'
import { useAuthStore } from '@/lib/store/auth'
import { Chip } from '@/components/ui/Chip'
import { Section } from './Section'

const roleLabels: Record<Role, string> = {
  ADMIN: 'Admin',
  USER: 'User',
  FILE_DOWNLOAD: 'File download',
  PAGE_STREAMING: 'Page streaming',
  KOBO_SYNC: 'Kobo sync',
  KOREADER_SYNC: 'KOReader sync',
}

export function ProfileSection() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null
  return (
    <Section title="Profile">
      <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-sm sm:grid-cols-[160px_1fr]">
        <dt className="text-ink-3">Email</dt>
        <dd className="min-w-0 truncate text-ink">{user.email}</dd>
        <dt className="text-ink-3">Roles</dt>
        <dd className="flex min-w-0 flex-wrap gap-1.5">
          {user.roles.map((r) => (
            <Chip key={r}>{roleLabels[r]}</Chip>
          ))}
        </dd>
        <dt className="text-ink-3">Libraries</dt>
        <dd className="text-ink">
          {user.sharedAllLibraries ? 'All libraries' : `${user.sharedLibrariesIds.length} libraries`}
        </dd>
      </dl>
    </Section>
  )
}
