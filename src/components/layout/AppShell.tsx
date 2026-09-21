import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Books,
  BookBookmark,
  BookmarkSimple,
  House,
  List,
  MagnifyingGlass,
  Moon,
  SignOut,
  Sun,
  UserCircle,
  CaretDown,
  Monitor,
} from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils/cn'
import { librariesApi } from '@/lib/api/libraries'
import { usersApi } from '@/lib/api/users'
import { serverApi } from '@/lib/api/users'
import { useAuthStore } from '@/lib/store/auth'
import { useUiStore } from '@/lib/store/ui'
import { useLibraryPrefs } from '@/lib/store/libraryPrefs'
import { queryClient } from '@/lib/queryClient'
import { LogoMark } from '@/components/LogoMark'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from '@/components/ui/Menu'
import { Skeleton } from '@/components/ui/Skeleton'

function NavItem({
  to,
  icon,
  children,
  end,
  onClick,
}: {
  to: string
  icon: React.ReactNode
  children: React.ReactNode
  end?: boolean
  onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors duration-150',
          isActive ? 'bg-accent-soft font-medium text-accent-strong' : 'text-ink-2 hover:bg-raised hover:text-ink',
        )
      }
    >
      <span className="[&_svg]:size-[18px]">{icon}</span>
      <span className="truncate">{children}</span>
    </NavLink>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: libraries, isLoading } = useQuery({ queryKey: ['libraries'], queryFn: librariesApi.list })
  const preferredTab = useLibraryPrefs((s) => s.tab)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-15 items-center gap-2.5 px-4 pt-2">
        <LogoMark className="size-7" />
        <span className="font-display text-xl font-semibold tracking-tight">kmrs</span>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
        <NavItem to="/dashboard" icon={<House />} onClick={onNavigate}>
          Dashboard
        </NavItem>
        <NavItem to="/search" icon={<MagnifyingGlass />} onClick={onNavigate}>
          Search
        </NavItem>

        <div className="mt-5 mb-1.5 px-3 text-[11px] font-medium tracking-[0.08em] text-ink-3 uppercase">
          Libraries
        </div>
        {isLoading && (
          <div className="flex flex-col gap-2 px-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        )}
        {libraries?.map((lib) => (
          <NavItem
            key={lib.id}
            to={`/libraries/${lib.id}/${preferredTab[lib.id] ?? 'series'}`}
            icon={<BookBookmark />}
            onClick={onNavigate}
          >
            {lib.name}
          </NavItem>
        ))}
        {libraries?.length === 0 && <p className="px-3 text-[13px] text-ink-3">No libraries yet</p>}

        <div className="mt-5 mb-1.5 px-3 text-[11px] font-medium tracking-[0.08em] text-ink-3 uppercase">
          Curated
        </div>
        <NavItem to="/collections" icon={<Books />} onClick={onNavigate}>
          Collections
        </NavItem>
        <NavItem to="/readlists" icon={<BookmarkSimple />} onClick={onNavigate}>
          Read lists
        </NavItem>
      </nav>

      <SidebarFooter />
    </div>
  )
}

function SidebarFooter() {
  const user = useAuthStore((s) => s.user)
  const clear = useAuthStore((s) => s.clear)
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)
  const navigate = useNavigate()
  const { data: info } = useQuery({ queryKey: ['server-info'], queryFn: serverApi.info, staleTime: Infinity })

  const logout = async () => {
    try {
      await usersApi.logout()
    } finally {
      clear()
      queryClient.clear()
      navigate('/login')
    }
  }

  const themeIcon = theme === 'light' ? <Sun /> : theme === 'dark' ? <Moon /> : <Monitor />
  const themeLabel = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'

  return (
    <div className="border-t border-line p-3">
      <Menu
        align="start"
        side="top"
        trigger={
          <button className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-raised">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-strong">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">{user?.email}</span>
            <CaretDown className="size-3.5 text-ink-3" />
          </button>
        }
      >
        <MenuLabel>{user?.email}</MenuLabel>
        <MenuItem onSelect={() => navigate('/account')}>
          <UserCircle className="size-4" /> Account
        </MenuItem>
        <MenuItem onSelect={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}>
          {themeIcon} Theme: {themeLabel}
        </MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={logout}>
          <SignOut className="size-4" /> Sign out
        </MenuItem>
        {info?.build?.version && (
          <>
            <MenuSeparator />
            <MenuLabel>kmrs {info.build.version}</MenuLabel>
          </>
        )}
      </Menu>
    </div>
  )
}

function TopSearchBox() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <form
      className="relative w-full max-w-md"
      onSubmit={(e) => {
        e.preventDefault()
        if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`)
      }}
    >
      <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search series, books, authors…"
        className="h-9 w-full rounded-lg border border-line bg-surface pr-12 pl-9 text-sm text-ink transition-colors placeholder:text-ink-3 focus:border-accent/70 focus:outline-none"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-line bg-raised px-1.5 text-[11px] text-ink-3">
        /
      </kbd>
    </form>
  )
}

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh bg-bg">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-line bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-20 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-20 w-64 border-r border-line bg-surface lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            >
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-15 shrink-0 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-md md:px-8">
          <IconButton label="Menu" className="lg:hidden" onClick={() => setDrawerOpen(true)}>
            <List className="size-5" />
          </IconButton>
          <div className="hidden flex-1 md:block">
            <TopSearchBox />
          </div>
          <div className="flex-1 md:hidden" />
          <IconButton label="Search" className="md:hidden" onClick={() => navigate('/search')}>
            <MagnifyingGlass className="size-5" />
          </IconButton>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
