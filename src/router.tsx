import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/routes/login'
import { DashboardPage } from '@/routes/dashboard'
import { BrowseSeriesPage } from '@/routes/browse/series'
import { BrowseBooksPage } from '@/routes/browse/books'
import { BrowseCollectionsPage } from '@/routes/browse/collections'
import { BrowseReadListsPage } from '@/routes/browse/readlists'
import { SeriesDetailPage } from '@/routes/detail/series'
import { BookDetailPage } from '@/routes/detail/book'
import { CollectionDetailPage } from '@/routes/detail/collection'
import { ReadListDetailPage } from '@/routes/detail/readlist'
import { SearchPage } from '@/routes/search'
import { AccountPage } from '@/routes/account'
import { ReaderPage } from '@/routes/read'
import { NotFoundPage } from '@/routes/not-found'
import { useLibraryPrefs, type BrowseTab } from '@/lib/store/libraryPrefs'

function LibraryRedirect() {
  const { libraryId = '' } = useParams()
  const tab = useLibraryPrefs((s) => s.tab[libraryId]) as BrowseTab | undefined
  return <Navigate to={`/libraries/${libraryId}/${tab ?? 'series'}`} replace />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/book/:bookId/read', element: <ReaderPage /> },
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/libraries/:libraryId', element: <LibraryRedirect /> },
          { path: '/libraries/:libraryId/recommended', element: <DashboardPage /> },
          { path: '/libraries/:libraryId/series', element: <BrowseSeriesPage /> },
          { path: '/libraries/:libraryId/books', element: <BrowseBooksPage /> },
          { path: '/libraries/:libraryId/collections', element: <BrowseCollectionsPage /> },
          { path: '/libraries/:libraryId/readlists', element: <BrowseReadListsPage /> },
          { path: '/series', element: <BrowseSeriesPage /> },
          { path: '/books', element: <BrowseBooksPage /> },
          { path: '/collections', element: <BrowseCollectionsPage /> },
          { path: '/collections/:collectionId', element: <CollectionDetailPage /> },
          { path: '/readlists', element: <BrowseReadListsPage /> },
          { path: '/readlists/:readListId', element: <ReadListDetailPage /> },
          { path: '/series/:seriesId', element: <SeriesDetailPage /> },
          { path: '/book/:bookId', element: <BookDetailPage /> },
          { path: '/search', element: <SearchPage /> },
          { path: '/account', element: <AccountPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
