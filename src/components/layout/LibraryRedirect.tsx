import { Navigate, useParams } from 'react-router-dom'
import { useLibraryPrefs, type BrowseTab } from '@/lib/store/libraryPrefs'

export function LibraryRedirect() {
  const { libraryId = '' } = useParams()
  const tab = useLibraryPrefs((s) => s.tab[libraryId]) as BrowseTab | undefined
  return <Navigate to={`/libraries/${libraryId}/${tab ?? 'series'}`} replace />
}
