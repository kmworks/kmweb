import type { BookDto } from '@/lib/api/types'

/** Reader route for a book, or null when the web reader cannot display it (EPUB). */
export function readRoute(book: Pick<BookDto, 'id' | 'media'>): string | null {
  if (book.media.mediaProfile === 'EPUB' && !book.media.epubDivinaCompatible) return null
  return `/book/${book.id}/read`
}

export function bookDetailRoute(book: Pick<BookDto, 'id'>): string {
  return `/book/${book.id}`
}
