export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return ''
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = bytes / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`
}

export function formatDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function relativeTime(iso?: string): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

export function readingDirectionLabel(dir?: string): string {
  switch (dir) {
    case 'LEFT_TO_RIGHT':
      return 'Left to right'
    case 'RIGHT_TO_LEFT':
      return 'Right to left'
    case 'VERTICAL':
      return 'Vertical'
    case 'WEBTOON':
      return 'Webtoon'
    default:
      return ''
  }
}

export function seriesStatusLabel(status?: string): string {
  switch (status) {
    case 'ONGOING':
      return 'Ongoing'
    case 'ENDED':
      return 'Ended'
    case 'ABANDONED':
      return 'Abandoned'
    case 'HIATUS':
      return 'Hiatus'
    default:
      return ''
  }
}

export function plural(n: number, word: string, words?: string): string {
  return n === 1 ? `${n} ${word}` : `${n} ${words ?? `${word}s`}`
}
