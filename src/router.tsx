import { Suspense, lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { RequireAdmin } from '@/components/layout/RequireAdmin'
import { AppShell } from '@/components/layout/AppShell'
import { LibraryRedirect } from '@/components/layout/LibraryRedirect'
import { LoginPage } from '@/routes/login'
import { DashboardPage } from '@/routes/dashboard'
import { DashboardSectionPage } from '@/routes/dashboard-section'
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
import { AdminLibrariesPage } from '@/routes/admin/libraries'
import { AdminUsersPage } from '@/routes/admin/users'
import { AdminSettingsPage } from '@/routes/admin/settings'
import { AdminServerPage } from '@/routes/admin/server'
import { NotFoundPage } from '@/routes/not-found'
import { ReaderSplash } from '@/components/reader/ReaderSplash'

const ReaderPage = lazy(() => import('@/routes/read').then((m) => ({ default: m.ReaderPage })))

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/book/:bookId/read',
        element: (
          <Suspense fallback={<ReaderSplash />}>
            <ReaderPage />
          </Suspense>
        ),
      },
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/dashboard/sections/:sectionKey', element: <DashboardSectionPage /> },
          { path: '/libraries/:libraryId', element: <LibraryRedirect /> },
          { path: '/libraries/:libraryId/recommended', element: <DashboardPage /> },
          { path: '/libraries/:libraryId/sections/:sectionKey', element: <DashboardSectionPage /> },
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
          {
            element: <RequireAdmin />,
            children: [
              { path: '/admin', element: <Navigate to="/admin/libraries" replace /> },
              { path: '/admin/libraries', element: <AdminLibrariesPage /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
              { path: '/admin/settings', element: <AdminSettingsPage /> },
              { path: '/admin/server', element: <AdminServerPage /> },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
