import { useCallback, useMemo, useState } from 'react'

export interface Selection {
  /** selected ids, in insertion order */
  ids: string[]
  size: number
  /** true once at least one item is selected; drives card-wide toggle behavior */
  active: boolean
  has: (id: string) => boolean
  toggle: (id: string) => void
  selectAll: (ids: string[]) => void
  clear: () => void
}

export function useSelection(): Selection {
  const [ids, setIds] = useState<string[]>([])

  const toggle = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }, [])
  const selectAll = useCallback((all: string[]) => setIds(all), [])
  // keep the same state when already empty so filter-change effects don't re-render
  const clear = useCallback(() => setIds((prev) => (prev.length ? [] : prev)), [])
  const has = useCallback((id: string) => ids.includes(id), [ids])

  return useMemo(
    () => ({ ids, size: ids.length, active: ids.length > 0, has, toggle, selectAll, clear }),
    [ids, has, toggle, selectAll, clear],
  )
}

export interface CardSelection {
  /** selection mode is on: checkbox always visible, card click toggles */
  active: boolean
  selected: boolean
  onToggle: () => void
}

export function cardSelection(sel: Selection, id: string): CardSelection {
  return { active: sel.active, selected: sel.has(id), onToggle: () => sel.toggle(id) }
}
