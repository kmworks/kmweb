/** Compact duration: "3d 4h" / "4h 12m" / "5m" / "42s", sub-second as ms. */
export function formatDuration(seconds: number): string {
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`
  if (seconds < 60) return `${Math.floor(seconds)}s`
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (d === 0 && m > 0) parts.push(`${m}m`)
  return parts.slice(0, 2).join(' ')
}

export function formatInterval(ms: number): string {
  return `Every ${formatDuration(ms / 1000)}`
}

/** ScanLibrary → "Scan library" */
export function taskTypeLabel(type: string): string {
  const words = type.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase()
}

/** Drop package prefixes / lambda suffixes so "a.b.SseController.heartbeat" → "SseController.heartbeat". */
export function targetLabel(target: string): string {
  const cleaned = target.replace(/\$.*$/, '')
  const parts = cleaned.split('.')
  return parts.length >= 3 ? parts.slice(-2).join('.') : cleaned
}
