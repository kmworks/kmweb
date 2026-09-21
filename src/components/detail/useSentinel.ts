import { useEffect, useRef } from 'react'

/** Fires when the sentinel div nears the viewport; drives infinite paging. */
export function useSentinel(onNear: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null)
  const cb = useRef(onNear)
  useEffect(() => {
    cb.current = onNear
  })
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) cb.current()
      },
      { rootMargin: '600px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [enabled])
  return ref
}
