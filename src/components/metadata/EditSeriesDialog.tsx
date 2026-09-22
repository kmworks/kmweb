import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { seriesApi } from '@/lib/api/series'
import type { ReadingDirection, SeriesDto, SeriesMetadataUpdateDto, SeriesStatus } from '@/lib/api/types'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/Skeleton'
import { TextField } from '@/components/ui/TextField'
import { EmptyState } from '@/components/ui/EmptyState'
import { LabelListEditor } from '@/components/admin/users/LabelListEditor'
import { BatchField, FormErrorBanner, PairListEditor, TextAreaField, TextInput, type Pair, type PairErrors } from './fields'
import { isValidBcp47, isValidUrl, mapViolations } from './validation'

const STATUS_OPTIONS: { value: SeriesStatus; label: string }[] = [
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'ENDED', label: 'Ended' },
  { value: 'ABANDONED', label: 'Abandoned' },
  { value: 'HIATUS', label: 'Hiatus' },
]

const DIRECTIONS: ReadingDirection[] = ['LEFT_TO_RIGHT', 'RIGHT_TO_LEFT', 'VERTICAL', 'WEBTOON']
const DIRECTION_OPTIONS: { value: ReadingDirection | ''; label: string }[] = [
  { value: '', label: 'Not set' },
  { value: 'LEFT_TO_RIGHT', label: 'Left to right' },
  { value: 'RIGHT_TO_LEFT', label: 'Right to left' },
  { value: 'VERTICAL', label: 'Vertical' },
  { value: 'WEBTOON', label: 'Webtoon' },
]

const asDirection = (v: string): ReadingDirection | '' => (DIRECTIONS as string[]).includes(v) ? (v as ReadingDirection) : ''

const GENERAL_FIELDS = ['title', 'titleSort', 'summary', 'status', 'language', 'publisher', 'ageRating', 'totalBookCount', 'readingDirection']

type Tab = 'general' | 'titles' | 'tags' | 'links' | 'sharing'

const TAB_OF_FIELD: Record<string, Tab> = {
  ...Object.fromEntries(GENERAL_FIELDS.map((f) => [f, 'general' as Tab])),
  alternateTitles: 'titles',
  genres: 'tags',
  tags: 'tags',
  links: 'links',
  sharingLabels: 'sharing',
}

export function EditSeriesDialog({ open, onClose, seriesIds }: { open: boolean; onClose: () => void; seriesIds: string[] }) {
  const singleId = seriesIds.length === 1 ? seriesIds[0] : null
  const seriesQuery = useQuery({
    queryKey: ['series', singleId],
    queryFn: () => seriesApi.get(singleId!),
    enabled: open && !!singleId,
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
      title={singleId ? 'Edit series metadata' : `Edit metadata of ${seriesIds.length} series`}
      size="lg"
    >
      {singleId && seriesQuery.isPending && (
        <div className="flex flex-col gap-4 px-5 py-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {singleId && seriesQuery.error && (
        <EmptyState
          title="Could not load the series"
          body={seriesQuery.error.message}
          action={
            <Button variant="secondary" onClick={() => seriesQuery.refetch()}>
              Retry
            </Button>
          }
        />
      )}
      {singleId && seriesQuery.data && <SingleSeriesForm key={seriesQuery.data.id} series={seriesQuery.data} onClose={onClose} />}
      {!singleId && open && <BatchSeriesForm key={seriesIds.join(',')} ids={seriesIds} onClose={onClose} />}
    </Dialog>
  )
}

function SingleSeriesForm({ series, onClose }: { series: SeriesDto; onClose: () => void }) {
  const queryClient = useQueryClient()
  const md = series.metadata
  const [tab, setTab] = useState<Tab>('general')
  const [title, setTitle] = useState(md.title)
  const [titleSort, setTitleSort] = useState(md.titleSort)
  const [summary, setSummary] = useState(md.summary)
  const [status, setStatus] = useState<SeriesStatus>(md.status)
  const [language, setLanguage] = useState(md.language)
  const [direction, setDirection] = useState<ReadingDirection | ''>(asDirection(md.readingDirection))
  const [publisher, setPublisher] = useState(md.publisher)
  const [ageRating, setAgeRating] = useState(md.ageRating != null ? String(md.ageRating) : '')
  const [totalBookCount, setTotalBookCount] = useState(md.totalBookCount != null ? String(md.totalBookCount) : '')
  const [altTitles, setAltTitles] = useState<Pair[]>(md.alternateTitles.map((t) => ({ a: t.label, b: t.title })))
  const [genres, setGenres] = useState<string[]>(md.genres)
  const [tags, setTags] = useState<string[]>(md.tags)
  const [links, setLinks] = useState<Pair[]>(md.links.map((l) => ({ a: l.label, b: l.url })))
  const [sharingLabels, setSharingLabels] = useState<string[]>(md.sharingLabels)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pairErrors, setPairErrors] = useState<{ alternateTitles: PairErrors; links: PairErrors }>({ alternateTitles: {}, links: {} })
  const [formErrors, setFormErrors] = useState<string[]>([])

  const save = useMutation({
    mutationFn: (body: SeriesMetadataUpdateDto) => seriesApi.patchMetadata(series.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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
        alternateTitles: { ...p.alternateTitles, ...mapped.pairs.alternateTitles },
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

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const te: PairErrors = {}
    const le: PairErrors = {}
    if (!title.trim()) e.title = 'Must not be blank'
    if (!titleSort.trim()) e.titleSort = 'Must not be blank'
    if (ageRating.trim() && (!Number.isInteger(Number(ageRating)) || Number(ageRating) < 0))
      e.ageRating = 'Must be a whole number of 0 or more'
    if (totalBookCount.trim() && (!Number.isInteger(Number(totalBookCount)) || Number(totalBookCount) <= 0))
      e.totalBookCount = 'Must be a whole number greater than 0'
    if (language.trim() && !isValidBcp47(language.trim())) e.language = 'Must be a valid BCP 47 language tag'
    altTitles.forEach((p, i) => {
      const row: { a?: string; b?: string } = {}
      if (!p.a.trim()) row.a = 'Must not be blank'
      if (!p.b.trim()) row.b = 'Must not be blank'
      if (row.a || row.b) te[i] = row
    })
    links.forEach((p, i) => {
      const row: { a?: string; b?: string } = {}
      if (!p.a.trim()) row.a = 'Must not be blank'
      if (!isValidUrl(p.b.trim())) row.b = 'Must be a valid URL'
      if (row.a || row.b) le[i] = row
    })
    setErrors(e)
    setPairErrors({ alternateTitles: te, links: le })
    setFormErrors([])
    const failed = [...Object.keys(e), ...(Object.keys(te).length > 0 ? ['alternateTitles'] : []), ...(Object.keys(le).length > 0 ? ['links'] : [])]
    if (failed.length > 0) {
      jumpToError(failed)
      return false
    }
    return true
  }

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    if (save.isPending || !validate()) return
    save.mutate({
      title: title.trim(),
      titleSort: titleSort.trim(),
      summary,
      status,
      language: language.trim(),
      publisher: publisher.trim(),
      readingDirection: direction === '' ? null : direction,
      ageRating: ageRating.trim() === '' ? null : Number(ageRating),
      totalBookCount: totalBookCount.trim() === '' ? null : Number(totalBookCount),
      genres,
      tags,
      sharingLabels,
      alternateTitles: altTitles.map((p) => ({ label: p.a.trim(), title: p.b.trim() })),
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
            { value: 'titles', label: 'Titles' },
            { value: 'tags', label: 'Tags' },
            { value: 'links', label: 'Links' },
            { value: 'sharing', label: 'Sharing' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'general' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Title" required value={title} onChange={(e) => { setTitle(e.target.value); clearError('title') }} error={errors.title} />
              <TextField
                label="Sort title"
                required
                value={titleSort}
                onChange={(e) => { setTitleSort(e.target.value); clearError('titleSort') }}
                error={errors.titleSort}
              />
            </div>
            <TextAreaField label="Summary" value={summary} onChange={setSummary} error={errors.summary} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium text-ink-2">Status</span>
                <SegmentedControl<SeriesStatus> options={STATUS_OPTIONS} value={status} onChange={setStatus} className="flex flex-wrap" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium text-ink-2">Reading direction</span>
                <SegmentedControl<ReadingDirection | ''>
                  options={DIRECTION_OPTIONS}
                  value={direction}
                  onChange={setDirection}
                  className="flex flex-wrap"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Publisher"
                value={publisher}
                onChange={(e) => { setPublisher(e.target.value); clearError('publisher') }}
                error={errors.publisher}
              />
              <TextField
                label="Language"
                placeholder="en, ja, zh-Hans…"
                value={language}
                onChange={(e) => { setLanguage(e.target.value); clearError('language') }}
                error={errors.language}
                helper={errors.language ? undefined : 'BCP 47 tag, empty to clear'}
              />
              <TextField
                label="Age rating"
                inputMode="numeric"
                placeholder="Not set"
                value={ageRating}
                onChange={(e) => { setAgeRating(e.target.value); clearError('ageRating') }}
                error={errors.ageRating}
              />
              <TextField
                label="Total book count"
                inputMode="numeric"
                placeholder="Not set"
                value={totalBookCount}
                onChange={(e) => { setTotalBookCount(e.target.value); clearError('totalBookCount') }}
                error={errors.totalBookCount}
              />
            </div>
          </>
        )}

        {tab === 'titles' && (
          <PairListEditor
            label="Alternate titles"
            pairs={altTitles}
            onChange={setAltTitles}
            aLabel="Label"
            bLabel="Title"
            aPlaceholder="ja"
            bPlaceholder="ベルセルク"
            addLabel="Add title"
            errors={pairErrors.alternateTitles}
          />
        )}

        {tab === 'tags' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <LabelListEditor label="Genres" values={genres} onChange={setGenres} placeholder="Add genre…" />
            <LabelListEditor label="Tags" values={tags} onChange={setTags} placeholder="Add tag…" />
          </div>
        )}

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

        {tab === 'sharing' && (
          <LabelListEditor label="Sharing labels" values={sharingLabels} onChange={setSharingLabels} placeholder="Add label…" />
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

type BatchKey = 'status' | 'readingDirection' | 'publisher' | 'language' | 'ageRating' | 'genres' | 'tags' | 'sharingLabels'

function BatchSeriesForm({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState<Partial<Record<BatchKey, boolean>>>({})
  const [status, setStatus] = useState<SeriesStatus>('ONGOING')
  const [direction, setDirection] = useState<ReadingDirection | ''>('')
  const [publisher, setPublisher] = useState('')
  const [language, setLanguage] = useState('')
  const [ageRating, setAgeRating] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [sharingLabels, setSharingLabels] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formErrors, setFormErrors] = useState<string[]>([])

  const toggle = (key: BatchKey) => (v: boolean) => setEnabled((p) => ({ ...p, [key]: v }))
  const anyEnabled = Object.values(enabled).some(Boolean)

  const save = useMutation({
    mutationFn: async (body: SeriesMetadataUpdateDto) => {
      await Promise.all(ids.map((id) => seriesApi.patchMetadata(id, body)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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
    if (enabled.ageRating && ageRating.trim() && (!Number.isInteger(Number(ageRating)) || Number(ageRating) < 0))
      e.ageRating = 'Must be a whole number of 0 or more'
    if (enabled.language && language.trim() && !isValidBcp47(language.trim())) e.language = 'Must be a valid BCP 47 language tag'
    setErrors(e)
    setFormErrors([])
    if (Object.keys(e).length > 0) return

    const body: SeriesMetadataUpdateDto = {}
    if (enabled.status) body.status = status
    if (enabled.readingDirection) body.readingDirection = direction === '' ? null : direction
    if (enabled.publisher) body.publisher = publisher.trim()
    if (enabled.language) body.language = language.trim()
    if (enabled.ageRating) body.ageRating = ageRating.trim() === '' ? null : Number(ageRating)
    if (enabled.genres) body.genres = genres
    if (enabled.tags) body.tags = tags
    if (enabled.sharingLabels) body.sharingLabels = sharingLabels
    save.mutate(body)
  }

  return (
    <form onSubmit={submit}>
      <div className="flex flex-col gap-3 px-5 py-4">
        <FormErrorBanner messages={formErrors} />
        <p className="text-sm text-ink-3">Only the fields you switch on are sent; everything else is left untouched.</p>

        <BatchField label="Status" enabled={!!enabled.status} onEnabledChange={toggle('status')}>
          <SegmentedControl<SeriesStatus> options={STATUS_OPTIONS} value={status} onChange={setStatus} className="flex flex-wrap" />
        </BatchField>

        <BatchField label="Reading direction" enabled={!!enabled.readingDirection} onEnabledChange={toggle('readingDirection')} hint="“Not set” clears the direction.">
          <SegmentedControl<ReadingDirection | ''> options={DIRECTION_OPTIONS} value={direction} onChange={setDirection} className="flex flex-wrap" />
        </BatchField>

        <BatchField label="Publisher" enabled={!!enabled.publisher} onEnabledChange={toggle('publisher')}>
          <TextInput value={publisher} onChange={(e) => setPublisher(e.target.value)} aria-label="Publisher" />
        </BatchField>

        <BatchField label="Language" enabled={!!enabled.language} onEnabledChange={toggle('language')} hint="BCP 47 tag, empty to clear.">
          <TextInput
            value={language}
            onChange={(e) => { setLanguage(e.target.value); setErrors((p) => { const next = { ...p }; delete next.language; return next }) }}
            aria-label="Language"
            placeholder="en, ja, zh-Hans…"
            error={!!errors.language}
          />
          {errors.language && <p className="mt-1 text-[13px] text-danger">{errors.language}</p>}
        </BatchField>

        <BatchField label="Age rating" enabled={!!enabled.ageRating} onEnabledChange={toggle('ageRating')} hint="Empty clears the rating.">
          <TextInput
            value={ageRating}
            onChange={(e) => { setAgeRating(e.target.value); setErrors((p) => { const next = { ...p }; delete next.ageRating; return next }) }}
            aria-label="Age rating"
            inputMode="numeric"
            error={!!errors.ageRating}
          />
          {errors.ageRating && <p className="mt-1 text-[13px] text-danger">{errors.ageRating}</p>}
        </BatchField>

        <BatchField label="Genres" enabled={!!enabled.genres} onEnabledChange={toggle('genres')} hint="Replaces all genres; an empty list clears them.">
          <LabelListEditor label="Genres" values={genres} onChange={setGenres} placeholder="Add genre…" />
        </BatchField>

        <BatchField label="Tags" enabled={!!enabled.tags} onEnabledChange={toggle('tags')} hint="Replaces all tags; an empty list clears them.">
          <LabelListEditor label="Tags" values={tags} onChange={setTags} placeholder="Add tag…" />
        </BatchField>

        <BatchField label="Sharing labels" enabled={!!enabled.sharingLabels} onEnabledChange={toggle('sharingLabels')} hint="Replaces all sharing labels; an empty list clears them.">
          <LabelListEditor label="Sharing labels" values={sharingLabels} onChange={setSharingLabels} placeholder="Add label…" />
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
