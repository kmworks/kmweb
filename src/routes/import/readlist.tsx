import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, FileArrowUp, WarningCircle } from '@phosphor-icons/react'
import { readlistsApi } from '@/lib/api/collections'
import type { BookDto, ReadListRequestMatchDto } from '@/lib/api/types'
import { cn } from '@/lib/utils/cn'
import { plural } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { TextField } from '@/components/ui/TextField'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState } from '@/components/ui/EmptyState'
import { BookPickerDialog } from '@/components/readlists/BookPickerDialog'

const PAGE_SIZE = 50

interface Candidate {
  bookId: string
  number: string
  title: string
  seriesTitle: string
}

interface MatchRow {
  seriesCandidates: string[]
  number: string
  candidates: Candidate[]
  selected: Candidate | null
  /** user picked the book by hand instead of relying on the CBL match */
  manual: boolean
}

type RowStatus = 'matched' | 'ambiguous' | 'unmatched'
type StatusFilter = 'ALL' | RowStatus

function rowStatus(row: MatchRow): RowStatus {
  if (row.selected) return 'matched'
  return row.candidates.length === 0 ? 'unmatched' : 'ambiguous'
}

function toRows(match: ReadListRequestMatchDto): MatchRow[] {
  return match.requests.map((r) => {
    const seen = new Set<string>()
    const candidates = r.matches.flatMap((m) =>
      m.books
        .filter((b) => {
          if (seen.has(b.bookId)) return false
          seen.add(b.bookId)
          return true
        })
        .map((b) => ({ bookId: b.bookId, number: b.number, title: b.title, seriesTitle: m.series.title })),
    )
    return {
      seriesCandidates: [...r.request.series],
      number: r.request.number,
      candidates,
      selected: candidates.length === 1 ? candidates[0] : null,
      manual: false,
    }
  })
}

function toCandidate(b: BookDto): Candidate {
  return { bookId: b.id, number: b.metadata.number, title: b.metadata.title || b.name, seriesTitle: b.seriesTitle }
}

const statusBadge: Record<RowStatus, { label: string; className: string }> = {
  matched: { label: 'Matched', className: 'border-accent/40 bg-accent-soft text-accent-strong' },
  ambiguous: { label: 'Multiple', className: 'border-line bg-raised text-ink-2' },
  unmatched: { label: 'No match', className: 'border-danger/40 bg-danger/10 text-danger' },
}

function StatusBadge({ status }: { status: RowStatus }) {
  const s = statusBadge[status]
  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', s.className)}>
      {s.label}
    </span>
  )
}

export function ImportReadListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [match, setMatch] = useState<ReadListRequestMatchDto | null>(null)
  const [rows, setRows] = useState<MatchRow[]>([])
  const [name, setName] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [page, setPage] = useState(0)
  const [pickerRow, setPickerRow] = useState<number | null>(null)

  const matchMutation = useMutation({
    mutationFn: (f: File) => readlistsApi.matchComicRack(f),
    onSuccess: (data) => {
      setMatch(data)
      setRows(toRows(data))
      setName(data.readListMatch.name)
      setFilter('ALL')
      setPage(0)
    },
  })

  const createMutation = useMutation({
    mutationFn: (bookIds: string[]) =>
      readlistsApi.create({ name: name.trim(), summary: '', ordered: true, bookIds }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['readlists'] })
      navigate(`/readlists/${created.id}`)
    },
  })

  const counts = useMemo(() => {
    const c: Record<RowStatus, number> = { matched: 0, ambiguous: 0, unmatched: 0 }
    for (const r of rows) c[rowStatus(r)]++
    return c
  }, [rows])

  const filtered = useMemo(
    () => rows.map((r, index) => ({ r, index })).filter(({ r }) => filter === 'ALL' || rowStatus(r) === filter),
    [rows, filter],
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const selectedIds = useMemo(() => {
    const ids = rows.flatMap((r) => (r.selected ? [r.selected.bookId] : []))
    return [...new Set(ids)]
  }, [rows])
  const nameConflict = !!match && match.readListMatch.errorCode !== '' && name.trim() === match.readListMatch.name

  const patchRow = (index: number, patch: Partial<MatchRow>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))

  const reset = () => {
    setMatch(null)
    setRows([])
    setFile(null)
    matchMutation.reset()
    createMutation.reset()
  }

  return (
    <div>
      <PageHeader title="Import read list" subtitle="Create a read list from a ComicRack .cbl file" />

      {!match ? (
        <div className="max-w-xl rounded-xl border border-line bg-surface px-5 py-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".cbl,text/xml"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <FileArrowUp className="size-4" /> Choose file
            </Button>
            <p className="min-w-0 flex-1 truncate text-sm text-ink-2">{file ? file.name : 'No file chosen'}</p>
            <Button variant="primary" disabled={!file} loading={matchMutation.isPending} onClick={() => file && matchMutation.mutate(file)}>
              Match against library
            </Button>
          </div>
          {matchMutation.error && <p className="mt-4 text-sm text-danger">{matchMutation.error.message}</p>}
        </div>
      ) : (
        <>
          <div className="mb-5 rounded-xl border border-line bg-surface px-5 py-4">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <TextField
                label="Read list name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={nameConflict ? 'A read list with this name already exists' : undefined}
                className="w-72"
              />
              <p className="pb-2.5 text-sm text-ink-3">
                <span className="text-accent-strong">{counts.matched} matched</span>
                {' · '}
                <span className="text-ink-2">{counts.ambiguous} multiple</span>
                {' · '}
                <span className="text-danger">{counts.unmatched} no match</span>
              </p>
              <div className="ml-auto flex items-center gap-2 pb-0.5">
                <Button variant="ghost" size="sm" onClick={reset}>
                  Start over
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={createMutation.isPending}
                  disabled={selectedIds.length === 0 || !name.trim() || nameConflict}
                  onClick={() => createMutation.mutate(selectedIds)}
                >
                  Create read list ({plural(selectedIds.length, 'book')})
                </Button>
              </div>
            </div>
            {(counts.ambiguous > 0 || counts.unmatched > 0) && (
              <p className="mt-2 text-xs text-ink-3">Entries without a matched book are skipped.</p>
            )}
            {createMutation.error && <p className="mt-2 text-sm text-danger">{createMutation.error.message}</p>}
          </div>

          <div className="mb-4">
            <SegmentedControl
              size="sm"
              value={filter}
              onChange={(v) => {
                setFilter(v)
                setPage(0)
              }}
              options={[
                { value: 'ALL', label: `All (${rows.length})` },
                { value: 'matched', label: `Matched (${counts.matched})` },
                { value: 'ambiguous', label: `Multiple (${counts.ambiguous})` },
                { value: 'unmatched', label: `No match (${counts.unmatched})` },
              ]}
            />
          </div>

          {pageRows.length === 0 ? (
            <EmptyState icon={<WarningCircle />} title="Nothing here" body="No entries with this status." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line bg-surface">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-3">
                    <th className="px-4 py-2.5 font-medium">#</th>
                    <th className="px-4 py-2.5 font-medium">Requested</th>
                    <th className="px-4 py-2.5 font-medium">Matched book</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(({ r, index }) => {
                    const status = rowStatus(r)
                    return (
                      <tr key={index} className="border-t border-line">
                        <td className="px-4 py-2.5 font-mono text-xs text-ink-3">{index + 1}</td>
                        <td className="max-w-64 px-4 py-2.5">
                          <p className="truncate text-ink">{r.seriesCandidates.join(' / ') || 'Unknown series'}</p>
                          <p className="text-xs text-ink-3">#{r.number}</p>
                        </td>
                        <td className="max-w-72 px-4 py-2.5">
                          {r.selected ? (
                            <div className="min-w-0">
                              <p className="truncate text-ink">
                                {r.selected.title}
                                {r.manual && <span className="ml-1.5 text-xs text-accent-strong">manual</span>}
                              </p>
                              <p className="truncate text-xs text-ink-3">
                                {r.selected.seriesTitle} #{r.selected.number}
                              </p>
                            </div>
                          ) : status === 'ambiguous' ? (
                            <select
                              value=""
                              onChange={(e) => {
                                const c = r.candidates.find((c) => c.bookId === e.target.value)
                                if (c) patchRow(index, { selected: c, manual: true })
                              }}
                              className="h-8 w-full max-w-64 cursor-pointer rounded-lg border border-line bg-surface px-2 text-sm text-ink focus:border-accent/70 focus:outline-none"
                            >
                              <option value="" disabled>
                                Choose a book…
                              </option>
                              {r.candidates.map((c) => (
                                <option key={c.bookId} value={c.bookId}>
                                  {c.seriesTitle} #{c.number} · {c.title}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-ink-3">No library match</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setPickerRow(index)}>
                            {r.selected ? 'Change' : 'Pick book'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-ink-3">
                Page {safePage + 1} of {pageCount}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={safePage === 0} onClick={() => setPage((p) => p - 1)}>
                  <ArrowLeft className="size-4" /> Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          <BookPickerDialog
            open={pickerRow !== null}
            onOpenChange={(open) => !open && setPickerRow(null)}
            title={
              pickerRow !== null
                ? `Pick a book for ${rows[pickerRow].seriesCandidates.join(' / ') || 'entry'} #${rows[pickerRow].number}`
                : 'Pick a book'
            }
            confirmLabel="Use this book"
            mode="single"
            excludeIds={new Set(selectedIds)}
            onConfirm={(books) => {
              if (pickerRow !== null && books[0])
                patchRow(pickerRow, { selected: toCandidate(books[0]), manual: true })
              setPickerRow(null)
            }}
          />
        </>
      )}
    </div>
  )
}
