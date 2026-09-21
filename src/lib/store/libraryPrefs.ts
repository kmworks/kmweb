import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BrowseTab = 'recommended' | 'series' | 'books' | 'collections' | 'readlists'

interface LibraryPrefs {
  /** last active tab per library id */
  tab: Record<string, BrowseTab>
  /** last sort per browse scope (e.g. "series:<libraryId>", "books:<libraryId>") */
  sort: Record<string, string>
}

interface LibraryPrefsState extends LibraryPrefs {
  setTab: (libraryId: string, tab: BrowseTab) => void
  setSort: (scope: string, sort: string) => void
}

export const useLibraryPrefs = create<LibraryPrefsState>()(
  persist(
    (set) => ({
      tab: {},
      sort: {},
      setTab: (libraryId, tab) => set((s) => ({ tab: { ...s.tab, [libraryId]: tab } })),
      setSort: (scope, sort) => set((s) => ({ sort: { ...s.sort, [scope]: sort } })),
    }),
    { name: 'kmweb.libraryPrefs' },
  ),
)
