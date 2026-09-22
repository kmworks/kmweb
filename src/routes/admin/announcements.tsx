import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowSquareOut, Check, Checks, Megaphone, WarningCircle } from '@phosphor-icons/react'
import { announcementsApi } from '@/lib/api/announcements'
import type { FeedItemDto } from '@/lib/api/types'
import { cn } from '@/lib/utils/cn'
import { formatDate, plural } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { HtmlContent } from '@/components/admin/announcements/HtmlContent'

function AnnouncementCard({ item }: { item: FeedItemDto }) {
  const queryClient = useQueryClient()
  const read = item._komga?.read ?? false

  const markRead = useMutation({
    mutationFn: () => announcementsApi.markRead([item.id]),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  })

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-xl border bg-surface p-5 pl-6',
        read ? 'border-line' : 'border-line shadow-card',
      )}
    >
      {!read && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent" />}
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className={cn('text-[15px] font-semibold', read ? 'text-ink-2' : 'text-ink')}>
          {item.title ?? 'Announcement'}
        </h2>
        {item.date_modified && (
          <time
            className="text-xs text-ink-3"
            dateTime={item.date_modified}
            title={new Date(item.date_modified).toLocaleString()}
          >
            {formatDate(item.date_modified)}
          </time>
        )}
        <span className="ml-auto flex items-center gap-2">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-ink-3 hover:text-accent-strong"
            >
              <ArrowSquareOut className="size-3.5" />
              Source
            </a>
          )}
          {!read && (
            <Button size="sm" variant="ghost" loading={markRead.isPending} onClick={() => markRead.mutate()}>
              <Check className="size-4" />
              Mark read
            </Button>
          )}
        </span>
      </header>
      {item.content_html ? (
        <HtmlContent html={item.content_html} className={cn('mt-3', read && 'opacity-75')} />
      ) : (
        item.summary && <p className="mt-3 text-sm text-ink-2">{item.summary}</p>
      )}
    </article>
  )
}

export function AdminAnnouncementsPage() {
  const queryClient = useQueryClient()

  useEffect(() => {
    document.title = 'Announcements · KMReader'
  }, [])

  const q = useQuery({ queryKey: ['admin', 'announcements'], queryFn: announcementsApi.list })
  const items = q.data?.items ?? []
  const unreadIds = items.filter((i) => !i._komga?.read).map((i) => i.id)

  const markAllRead = useMutation({
    mutationFn: () => announcementsApi.markRead(unreadIds),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  })

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Announcements"
        subtitle={q.data ? `${plural(unreadIds.length, 'unread announcement')}` : 'News from the Komga project'}
        actions={
          unreadIds.length > 0 ? (
            <Button variant="secondary" loading={markAllRead.isPending} onClick={() => markAllRead.mutate()}>
              <Checks className="size-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {q.isPending ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : q.isError ? (
        <EmptyState
          icon={<WarningCircle />}
          title="Couldn't load announcements"
          body={q.error instanceof Error ? q.error.message : 'Something went wrong.'}
          action={<Button onClick={() => q.refetch()}>Retry</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={<Megaphone />} title="No announcements" body="News from the project will show up here." />
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <AnnouncementCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
