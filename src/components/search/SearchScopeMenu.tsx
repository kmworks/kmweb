import { useQuery } from '@tanstack/react-query'
import { BookBookmark, Books, CaretDown, Check, PushPin } from '@phosphor-icons/react'
import { librariesApi } from '@/lib/api/libraries'
import { usePinnedLibraries } from '@/lib/store/clientSettings'
import { useSearchScope } from '@/components/search/scope'
import { Button } from '@/components/ui/Button'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'

export function SearchScopeMenu() {
  const { data: libraries } = useQuery({ queryKey: ['libraries'], queryFn: librariesApi.list })
  const { pinned } = usePinnedLibraries()
  const { scope, setScope } = useSearchScope()
  const value = scope.kind === 'all' ? 'all' : scope.kind === 'pinned' ? 'pinned' : scope.id

  // pinned libraries float to the top, same as the sidebar
  const pinnedIndex = new Map((pinned ?? []).map((id, i) => [id, i]))
  const pinRank = (id: string) => pinnedIndex.get(id) ?? Number.MAX_SAFE_INTEGER
  const sorted = libraries?.slice().sort((a, b) => pinRank(a.id) - pinRank(b.id))
  const hasPinned = (pinned?.length ?? 0) > 0
  const current = scope.kind === 'library' ? libraries?.find((l) => l.id === scope.id) : undefined
  const label = value === 'all' ? 'All libraries' : value === 'pinned' ? 'Pinned libraries' : (current?.name ?? 'Library')

  return (
    <Menu
      align="start"
      trigger={
        <Button
          variant="secondary"
          size="sm"
          className="h-9 max-sm:px-2.5"
          aria-label={`Search scope: ${label}`}
        >
          {value === 'pinned' ? (
            <PushPin weight="fill" className="size-4 shrink-0" />
          ) : value === 'all' ? (
            <Books className="size-4 shrink-0" />
          ) : (
            <BookBookmark className="size-4 shrink-0" />
          )}
          <span className="max-w-40 truncate max-sm:hidden">{label}</span>
          <CaretDown className="size-3.5 shrink-0 text-ink-3 max-sm:hidden" />
        </Button>
      }
    >
      <MenuItem onSelect={() => setScope('all')}>
        <span className="flex-1">All libraries</span>
        {value === 'all' && <Check className="size-4 text-accent" />}
      </MenuItem>
      {hasPinned && (
        <MenuItem onSelect={() => setScope('pinned')}>
          <PushPin weight="fill" className="size-3.5 text-ink-3" />
          <span className="flex-1">Pinned libraries</span>
          {value === 'pinned' && <Check className="size-4 text-accent" />}
        </MenuItem>
      )}
      {sorted && sorted.length > 0 && <MenuSeparator />}
      {sorted?.map((l) => (
        <MenuItem key={l.id} onSelect={() => setScope(l.id)}>
          <span className="flex-1 truncate">{l.name}</span>
          {pinnedIndex.has(l.id) && <PushPin weight="fill" className="size-3 shrink-0 text-ink-3" />}
          {value === l.id && <Check className="size-4 text-accent" />}
        </MenuItem>
      ))}
    </Menu>
  )
}
