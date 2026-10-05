import { Buildings, MaskHappy, Tag, UsersThree } from '@phosphor-icons/react'
import type { AuthorDto } from '@/lib/api/types'
import { sortAuthorsByRole } from '@/lib/utils/authors'
import { serializeAuthor } from '@/components/filters/filterUrl'
import type { DetailChipItem } from './DetailChipFlow'

const iconCls = 'size-3.5'

/** publisher + author chips of a detail hero; authors link to the browse page under `base` */
export function creatorChipItems(publisher: string, authors: AuthorDto[], base: '/series' | '/books'): DetailChipItem[] {
  const items: DetailChipItem[] = []
  if (publisher)
    items.push({
      key: `publisher-${publisher}`,
      label: publisher,
      icon: <Buildings className={iconCls} />,
      to: `/series?publishers=${encodeURIComponent(publisher)}`,
    })
  for (const a of sortAuthorsByRole(authors))
    items.push({
      key: `author-${a.name}-${a.role}`,
      label: (
        <>
          {a.name} {a.role && <span className="text-ink-3">({a.role})</span>}
        </>
      ),
      to: `${base}?authors=${encodeURIComponent(serializeAuthor(a))}`,
    })
  return items
}

export function genreChipItems(genres: string[]): DetailChipItem[] {
  return genres.map((g) => ({
    key: `genre-${g}`,
    label: g,
    icon: <MaskHappy className={iconCls} />,
    to: `/series?genres=${encodeURIComponent(g)}`,
  }))
}

export function tagChipItems(tags: string[], base: '/series' | '/books'): DetailChipItem[] {
  return tags.map((t) => ({
    key: `tag-${t}`,
    label: t,
    icon: <Tag className={iconCls} />,
    to: `${base}?tags=${encodeURIComponent(t)}`,
  }))
}

/** Series tags first (sorted), then book-only tags (sorted) dimmed — mirrors the upstream series detail tag row */
export function combinedTagChipItems(seriesTags: string[], bookTags: string[], base: '/series' | '/books'): DetailChipItem[] {
  const series = [...new Set(seriesTags.filter(Boolean))].sort()
  const bookOnly = [...new Set(bookTags.filter(Boolean))]
    .filter((t) => !series.includes(t))
    .sort()
  return [
    ...series.map((t) => ({ key: `tag-${t}`, label: t, icon: <Tag className={iconCls} />, to: `${base}?tags=${encodeURIComponent(t)}` })),
    ...bookOnly.map((t) => ({ key: `tag-${t}`, label: t, icon: <Tag className={iconCls} />, to: `${base}?tags=${encodeURIComponent(t)}`, dimmed: true })),
  ]
}

export function sharingLabelChipItems(labels: string[]): DetailChipItem[] {
  return labels.map((s) => ({ key: `sharing-${s}`, label: s, icon: <UsersThree className={iconCls} /> }))
}
