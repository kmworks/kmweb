import { READER_BACKGROUNDS, useReaderSettings, type ReaderBackground, type ScaleType } from '@/lib/store/readerSettings'
import type { ReadingDirection } from '@/lib/api/types'
import type { PagedReaderLayout } from '@/lib/utils/spreads'
import { readingDirectionLabel } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Section, SettingRow } from './Section'

const directions: ReadingDirection[] = ['LEFT_TO_RIGHT', 'RIGHT_TO_LEFT', 'VERTICAL', 'WEBTOON']
const backgrounds = Object.keys(READER_BACKGROUNDS) as ReaderBackground[]

export function ReaderSection() {
  const readingDirection = useReaderSettings((s) => s.readingDirection)
  const scale = useReaderSettings((s) => s.scale)
  const pageLayout = useReaderSettings((s) => s.pageLayout)
  const background = useReaderSettings((s) => s.background)
  const update = useReaderSettings((s) => s.update)

  return (
    <Section title="Reader defaults">
      <div className="flex flex-col divide-y divide-line">
        <SettingRow label="Reading direction">
          <SegmentedControl<ReadingDirection>
            options={directions.map((d) => ({ value: d, label: readingDirectionLabel(d) }))}
            value={readingDirection}
            onChange={(readingDirection) => update({ readingDirection })}
          />
        </SettingRow>
        <SettingRow label="Scale">
          <div className="max-w-full overflow-x-auto">
            <SegmentedControl<ScaleType>
              options={[
                { value: 'SCREEN', label: 'Fit screen' },
                { value: 'WIDTH', label: 'Fit width' },
                { value: 'WIDTH_SHRINK_ONLY', label: 'Shrink to width' },
                { value: 'HEIGHT', label: 'Fit height' },
                { value: 'ORIGINAL', label: 'Original' },
              ]}
              value={scale}
              onChange={(scale) => update({ scale })}
            />
          </div>
        </SettingRow>
        <SettingRow label="Page layout">
          <SegmentedControl<PagedReaderLayout>
            options={[
              { value: 'SINGLE_PAGE', label: 'Single' },
              { value: 'DOUBLE_PAGES', label: 'Double' },
              { value: 'DOUBLE_NO_COVER', label: 'Double no cover' },
            ]}
            value={pageLayout}
            onChange={(pageLayout) => update({ pageLayout })}
          />
        </SettingRow>
        <SettingRow label="Background">
          <div className="flex items-center gap-2.5">
            {backgrounds.map((bg) => (
              <button
                key={bg}
                type="button"
                title={bg.toLowerCase()}
                aria-label={`Background ${bg.toLowerCase()}`}
                aria-pressed={background === bg}
                onClick={() => update({ background: bg })}
                style={{ backgroundColor: READER_BACKGROUNDS[bg] }}
                className={cn(
                  'size-7 cursor-pointer rounded-full border border-line-strong transition-transform active:scale-95',
                  background === bg && 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
                )}
              />
            ))}
          </div>
        </SettingRow>
      </div>
    </Section>
  )
}
