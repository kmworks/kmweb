// SSE event stream (/sse/v1/events). EventSource auto-reconnects; callers
// subscribe per event name. SessionExpired must force a re-login.

export const SSE_EVENTS = [
  'LibraryAdded',
  'LibraryChanged',
  'LibraryDeleted',
  'SeriesAdded',
  'SeriesChanged',
  'SeriesDeleted',
  'BookAdded',
  'BookChanged',
  'BookDeleted',
  'ReadListAdded',
  'ReadListChanged',
  'ReadListDeleted',
  'CollectionAdded',
  'CollectionChanged',
  'CollectionDeleted',
  'ReadProgressChanged',
  'ReadProgressDeleted',
  'ReadProgressSeriesChanged',
  'ReadProgressSeriesDeleted',
  'ThumbnailBookAdded',
  'ThumbnailBookDeleted',
  'ThumbnailSeriesAdded',
  'ThumbnailSeriesDeleted',
  'ThumbnailSeriesCollectionAdded',
  'ThumbnailSeriesCollectionDeleted',
  'ThumbnailReadListAdded',
  'ThumbnailReadListDeleted',
  'SessionExpired',
  'TaskQueueStatus',
] as const

export type SseEventName = (typeof SSE_EVENTS)[number]
export type SseHandler = (data: unknown) => void

class SseClient {
  private source: EventSource | null = null
  private handlers = new Map<SseEventName, Set<SseHandler>>()
  private registered = new Set<SseEventName>()

  connect() {
    if (this.source) return
    this.source = new EventSource('/sse/v1/events')
    for (const name of this.registered) this.attach(name)
  }

  disconnect() {
    this.source?.close()
    this.source = null
  }

  on(name: SseEventName, handler: SseHandler): () => void {
    if (!this.handlers.has(name)) this.handlers.set(name, new Set())
    this.handlers.get(name)!.add(handler)
    this.registered.add(name)
    if (this.source) this.attach(name)
    return () => {
      this.handlers.get(name)?.delete(handler)
    }
  }

  private attach(name: SseEventName) {
    if (!this.source) return
    this.source.addEventListener(name, (ev) => {
      let data: unknown = null
      try {
        data = JSON.parse((ev as MessageEvent).data)
      } catch {
        // heartbeat comments arrive without data
      }
      this.handlers.get(name)?.forEach((h) => h(data))
    })
  }
}

export const sse = new SseClient()
