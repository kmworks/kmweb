import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { booksApi } from '@/lib/api/books'
import type { BookDto, BookMetadataUpdateDto } from '@/lib/api/types'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/Skeleton'
import { TextField } from '@/components/ui/TextField'
import { EmptyState } from '@/components/ui/EmptyState'
import { LabelListEditor } from '@/components/admin/users/LabelListEditor'
import { BatchField, FormErrorBanner, PairListEditor, TextAreaField, TextInput, type Pair, type PairErrors } from './fields'
import { isValidIsbn13, isValidUrl, mapViolations } from './validation'

const GENERAL_FIELDS = ['title', 'summary', 'number', 'releaseDate', 'isbn']

type Tab = 'general' | 'authors' | 'tags' | 'links'

const TAB_OF_FIELD: Record<string, Tab> = {
  ...Object.fromEntries(GENERAL_FIELDS.map((f) => [f, 'general' as Tab])),
  authors: 'authors',
  tags: 'tags',
  links: 'links',
}

function validatePairs(pairs: Pair[], bCheck: (v: string) => string | undefined): PairErrors {
  const out: PairErrors = {}
  pairs.forEach((p, i) => {
    const row: { a?: string; b?: string } = {}
    if (!p.a.trim()) row.a = 'Must not be blank'
    const bError = bCheck(p.b)
    if (bError) row.b = bError
    if (row.a || row.b) out[i] = row
  })
  return out
}

const authorCheck = (v: string) => (v.trim() ? undefined : 'Must not be blank')
const urlCheck = (v: string) => (isValidUrl(v.trim()) ? undefined : 'Must be a valid URL')

export function EditBooksDialog({ open, onClose, bookIds }: { open: boolean; onClose: () => void; bookIds: string[] }) {
  const singleId = bookIds.length === 1 ? bookIds[0] : null
  const bookQuery = useQuery({
    queryKey: ['books', singleId],
    queryFn: () => booksApi.get(singleId!),
    enabled: open && !!singleId,
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
      title={singleId ? 'Edit book metadata' : `Edit metadata of ${bookIds.length} books`}
      size="lg"
    >
      {singleId && bookQuery.isPending && (
        <div className="flex flex-col gap-4 px-5 py-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {singleId && bookQuery.error && (
        <EmptyState
          title="Could not load the book"
          body={bookQuery.error.message}
          action={
            <Button variant="secondary" onClick={() => bookQuery.refetch()}>
              Retry
            </Button>
          }
        />
      )}
      {singleId && bookQuery.data && <SingleBookForm key={bookQuery.data.id} book={bookQuery.data} onClose={onClose} />}
      {!singleId && open && <BatchBooksForm key={bookIds.join(',')} ids={bookIds} onClose={onClose} />}
    </Dialog>
  )
}

function SingleBookForm({ book, onClose }: { book: BookDto; onClose: () => void }) {
  const queryClient = useQueryClient()
  const md = book.metadata
  const [tab, setTab] = useState<Tab>('general')
  const [title, setTitle] = useState(md.title)
  const [summary, setSummary] = useState(md.summary)
  const [number, setNumber] = useState(md.number)
  const [releaseDate, setReleaseDate] = useState(md.releaseDate ?? '')
  const [isbn, setIsbn] = useState(md.isbn)
  const [authors, setAuthors] = useState<Pair[]>(md.authors.map((a) => ({ a: a.name, b: a.role })))
  const [tags, setTags] = useState<string[]>(md.tags)
  const [links, setLinks] = useState<Pair[]>(md.links.map((l) => ({ a: l.label, b: l.url })))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pairErrors, setPairErrors] = useState<{ authors: PairErrors; links: PairErrors }>({ authors: {}, links: {} })
  const [formErrors, setFormErrors] = useState<string[]>([])

  const save = useMutation({
    mutationFn: (body: BookMetadataUpdateDto) => booksApi.patchMetadata(book.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['series'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['readlists'] })
      onClose()
    },
    onError: (err) => {
      const mapped = mapViolations(err)
      const scalars: Record<string, string> = {}
      const rest = [...mapped.rest]
      for (const [k, v] of Object.entries(mapped.scalars)) {
        if (TAB_OF_FIELD[k]) scalars[k] = v
        else rest.push(`${k}: ${v}`)
      }
      setErrors(scalars)
      setPairErrors((p) => ({
        authors: { ...p.authors, ...mapped.pairs.authors },
        links: { ...p.links, ...mapped.pairs.links },
      }))
      setFormErrors(rest.length > 0 ? rest : [err instanceof Error ? err.message : 'Could not save the metadata.'])
      jumpToError([...Object.keys(scalars), ...Object.keys(mapped.pairs)])
    },
  })

  const jumpToError = (fields: string[]) => {
    const first = fields.map((f) => TAB_OF_FIELD[f]).find((t) => t && t !== tab)
    if (first) setTab(first)
  }

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    if (save.isPending) return
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Must not be blank'
    if (!number.trim()) e.number = 'Must not be blank'
    if (isbn.trim() && !isValidIsbn13(isbn)) e.isbn = 'Must be blank or a valid ISBN-13'
    const ae = validatePairs(authors, authorCheck)
    const le = validatePairs(links, urlCheck)
    setErrors(e)
    setPairErrors({ authors: ae, links: le })
    setFormErrors([])
    const failed = [...Object.keys(e), ...(Object.keys(ae).length > 0 ? ['authors'] : []), ...(Object.keys(le).length > 0 ? ['links'] : [])]
    if (failed.length > 0) {
      jumpToError(failed)
      return
    }
    save.mutate({
      title: title.trim(),
      number: number.trim(),
      summary: summary.trim() === '' ? null : summary,
      releaseDate: releaseDate === '' ? null : releaseDate,
      isbn: isbn.trim() === '' ? null : isbn.trim(),
      authors: authors.map((p) => ({ name: p.a.trim(), role: p.b.trim() })),
      tags,
      links: links.map((p) => ({ label: p.a.trim(), url: p.b.trim() })),
    })
  }

  const clearError = (key: string) =>
    setErrors((p) => {
      const next = { ...p }
      delete next[key]
      return next
    })

  return (
    <form onSubmit={submit}>
      <div className="flex flex-col gap-5 px-5 py-4">
        <FormErrorBanner messages={formErrors} />
        <SegmentedControl<Tab>
          options={[
            { value: 'general', label: 'General' },
            { value: 'authors', label: 'Authors' },
            { value: 'tags', label: 'Tags' },
            { value: 'links', label: 'Links' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'general' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Title" required value={title} onChange={(e) => { setTitle(e.target.value); clearError('title') }} error={errors.title} />
              <TextField label="Number" required value={number} onChange={(e) => { setNumber(e.target.value); clearError('number') }} error={errors.number} />
              <TextField label="Release date" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} error={errors.releaseDate} />
              <TextField
                label="ISBN"
                value={isbn}
                onChange={(e) => { setIsbn(e.target.value); clearError('isbn') }}
                error={errors.isbn}
                helper={errors.isbn ? undefined : 'ISBN-13, empty to clear'}
              />
            </div>
            <TextAreaField label="Summary" value={summary} onChange={setSummary} error={errors.summary} />
          </>
        )}

        {tab === 'authors' && (
          <PairListEditor
            label="Authors"
            pairs={authors}
            onChange={setAuthors}
            aLabel="Name"
            bLabel="Role"
            aPlaceholder="Kentaro Miura"
            bPlaceholder="writer"
            addLabel="Add author"
            errors={pairErrors.authors}
          />
        )}

        {tab === 'tags' && <LabelListEditor label="Tags" values={tags} onChange={setTags} placeholder="Add tag…" />}

        {tab === 'links' && (
          <PairListEditor
            label="Web links"
            pairs={links}
            onChange={setLinks}
            aLabel="Label"
            bLabel="URL"
            aPlaceholder="Wiki"
            bPlaceholder="https://…"
            addLabel="Add link"
            errors={pairErrors.links}
          />
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={save.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  )
}

type BatchKey = 'summary' | 'releaseDate' | 'isbn' | 'authors' | 'tags' | 'links'

function BatchBooksForm({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState<Partial<Record<BatchKey, boolean>>>({})
  const [summary, setSummary] = useState('')
  const [releaseDate, setReleaseDate] = useState('')
  const [isbn, setIsbn] = useState('')
  const [authors, setAuthors] = useState<Pair[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [links, setLinks] = useState<Pair[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pairErrors, setPairErrors] = useState<{ authors: PairErrors; links: PairErrors }>({ authors: {}, links: {} })
  const [formErrors, setFormErrors] = useState<string[]>([])

  const toggle = (key: BatchKey) => (v: boolean) => setEnabled((p) => ({ ...p, [key]: v }))
  const anyEnabled = Object.values(enabled).some(Boolean)

  const save = useMutation({
    mutationFn: (body: BookMetadataUpdateDto) =>
      booksApi.bulkPatchMetadata(Object.fromEntries(ids.map((id) => [id, body]))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['series'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['readlists'] })
      onClose()
    },
    onError: (err) => {
      const mapped = mapViolations(err)
      setErrors(mapped.scalars)
      setFormErrors(mapped.rest.length > 0 ? mapped.rest : [err instanceof Error ? err.message : 'Could not save the metadata.'])
    },
  })

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    if (save.isPending || !anyEnabled) return
    const e: Record<string, string> = {}
    if (enabled.isbn && isbn.trim() && !isValidIsbn13(isbn)) e.isbn = 'Must be blank or a valid ISBN-13'
    const ae = enabled.authors ? validatePairs(authors, authorCheck) : {}
    const le = enabled.links ? validatePairs(links, urlCheck) : {}
    setErrors(e)
    setPairErrors({ authors: ae, links: le })
    setFormErrors([])
    if (Object.keys(e).length > 0 || Object.keys(ae).length > 0 || Object.keys(le).length > 0) return

    const body: BookMetadataUpdateDto = {}
    if (enabled.summary) body.summary = summary.trim() === '' ? null : summary
    if (enabled.releaseDate) body.releaseDate = releaseDate === '' ? null : releaseDate
    if (enabled.isbn) body.isbn = isbn.trim() === '' ? null : isbn.trim()
    if (enabled.authors) body.authors = authors.map((p) => ({ name: p.a.trim(), role: p.b.trim() }))
    if (enabled.tags) body.tags = tags
    if (enabled.links) body.links = links.map((p) => ({ label: p.a.trim(), url: p.b.trim() }))
    save.mutate(body)
  }

  return (
    <form onSubmit={submit}>
      <div className="flex flex-col gap-3 px-5 py-4">
        <FormErrorBanner messages={formErrors} />
        <p className="text-sm text-ink-3">Only the fields you switch on are sent; everything else is left untouched.</p>

        <BatchField label="Summary" enabled={!!enabled.summary} onEnabledChange={toggle('summary')} hint="Empty clears the summary.">
          <TextAreaField ariaLabel="Summary" value={summary} onChange={setSummary} />
        </BatchField>

        <BatchField label="Release date" enabled={!!enabled.releaseDate} onEnabledChange={toggle('releaseDate')} hint="Empty clears the date.">
          <TextInput type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} aria-label="Release date" />
        </BatchField>

        <BatchField label="ISBN" enabled={!!enabled.isbn} onEnabledChange={toggle('isbn')} hint="ISBN-13, empty to clear.">
          <TextInput
            value={isbn}
            onChange={(e) => { setIsbn(e.target.value); setErrors((p) => { const next = { ...p }; delete next.isbn; return next }) }}
            aria-label="ISBN"
            error={!!errors.isbn}
          />
          {errors.isbn && <p className="mt-1 text-[13px] text-danger">{errors.isbn}</p>}
        </BatchField>

        <BatchField label="Authors" enabled={!!enabled.authors} onEnabledChange={toggle('authors')} hint="Replaces all authors; an empty list clears them.">
          <PairListEditor
            pairs={authors}
            onChange={setAuthors}
            aLabel="Name"
            bLabel="Role"
            aPlaceholder="Kentaro Miura"
            bPlaceholder="writer"
            addLabel="Add author"
            errors={pairErrors.authors}
          />
        </BatchField>

        <BatchField label="Tags" enabled={!!enabled.tags} onEnabledChange={toggle('tags')} hint="Replaces all tags; an empty list clears them.">
          <LabelListEditor label="Tags" values={tags} onChange={setTags} placeholder="Add tag…" />
        </BatchField>

        <BatchField label="Web links" enabled={!!enabled.links} onEnabledChange={toggle('links')} hint="Replaces all links; an empty list clears them.">
          <PairListEditor
            pairs={links}
            onChange={setLinks}
            aLabel="Label"
            bLabel="URL"
            aPlaceholder="Wiki"
            bPlaceholder="https://…"
            addLabel="Add link"
            errors={pairErrors.links}
          />
        </BatchField>
      </div>

      <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={save.isPending} disabled={!anyEnabled}>
          Save changes
        </Button>
      </div>
    </form>
  )
}
