import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from '@phosphor-icons/react'
import type { ReadingDirection } from '@/lib/api/types'
import {
  READER_BACKGROUNDS,
  useReaderSettings,
  type ContinuousScaleType,
  type ReaderBackground,
  type ScaleType,
} from '@/lib/store/readerSettings'
import type { PagedReaderLayout } from '@/lib/utils/spreads'
import { IconButton } from '@/components/ui/IconButton'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Slider } from '@/components/ui/Slider'
import { Switch } from '@/components/ui/Switch'
import { cn } from '@/lib/utils/cn'

const DIRECTION_OPTIONS: { value: ReadingDirection; label: string }[] = [
  { value: 'LEFT_TO_RIGHT', label: 'LTR' },
  { value: 'RIGHT_TO_LEFT', label: 'RTL' },
  { value: 'VERTICAL', label: 'Vertical' },
  { value: 'WEBTOON', label: 'Webtoon' },
]

const PAGED_SCALE_OPTIONS: { value: ScaleType; label: string }[] = [
  { value: 'SCREEN', label: 'Screen' },
  { value: 'WIDTH', label: 'Width' },
  { value: 'WIDTH_SHRINK_ONLY', label: 'Shrink' },
  { value: 'HEIGHT', label: 'Height' },
  { value: 'ORIGINAL', label: 'Original' },
]

const CONTINUOUS_SCALE_OPTIONS: { value: ContinuousScaleType; label: string }[] = [
  { value: 'WIDTH', label: 'Fit width' },
  { value: 'ORIGINAL', label: 'Original' },
]

const LAYOUT_OPTIONS: { value: PagedReaderLayout; label: string }[] = [
  { value: 'SINGLE_PAGE', label: 'Single' },
  { value: 'DOUBLE_PAGES', label: 'Double' },
  { value: 'DOUBLE_NO_COVER', label: 'No cover' },
]

const BACKGROUNDS: { value: ReaderBackground; label: string }[] = [
  { value: 'BLACK', label: 'Black' },
  { value: 'GRAY', label: 'Gray' },
  { value: 'WHITE', label: 'White' },
]

interface SettingsPanelProps {
  open: boolean
  direction: ReadingDirection
  onDirectionChange: (direction: ReadingDirection) => void
  onAlwaysFullscreenChange: (on: boolean) => void
  onClose: () => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-[11px] font-medium tracking-wide text-white/50 uppercase">{title}</h3>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-white/80">{label}</span>
      {children}
    </div>
  )
}

export function SettingsPanel({
  open,
  direction,
  onDirectionChange,
  onAlwaysFullscreenChange,
  onClose,
}: SettingsPanelProps) {
  const scale = useReaderSettings((s) => s.scale)
  const pageLayout = useReaderSettings((s) => s.pageLayout)
  const continuousScale = useReaderSettings((s) => s.continuousScale)
  const continuousPadding = useReaderSettings((s) => s.continuousPadding)
  const continuousMargin = useReaderSettings((s) => s.continuousMargin)
  const swipe = useReaderSettings((s) => s.swipe)
  const animations = useReaderSettings((s) => s.animations)
  const alwaysFullscreen = useReaderSettings((s) => s.alwaysFullscreen)
  const background = useReaderSettings((s) => s.background)
  const update = useReaderSettings((s) => s.update)
  const reduceMotion = useReducedMotion()

  const webtoon = direction === 'WEBTOON'

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-30 bg-black/40"
            onClick={onClose}
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-label="Reader settings"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 z-30 flex h-full w-80 max-w-[85vw] flex-col border-l border-white/10 bg-black/85 text-white backdrop-blur-md"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-[15px] font-semibold">Reader settings</h2>
              <IconButton
                label="Close settings"
                className="text-white/80 hover:bg-white/10 hover:text-white"
                onClick={onClose}
              >
                <X className="size-4" />
              </IconButton>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
              <Section title="Reading direction">
                <SegmentedControl
                  options={DIRECTION_OPTIONS}
                  value={direction}
                  onChange={onDirectionChange}
                  size="sm"
                  className="flex flex-wrap"
                />
              </Section>

              <Section title="Scale">
                {webtoon ? (
                  <SegmentedControl
                    options={CONTINUOUS_SCALE_OPTIONS}
                    value={continuousScale}
                    onChange={(v) => update({ continuousScale: v })}
                    size="sm"
                  />
                ) : (
                  <SegmentedControl
                    options={PAGED_SCALE_OPTIONS}
                    value={scale}
                    onChange={(v) => update({ scale: v })}
                    size="sm"
                    className="flex flex-wrap"
                  />
                )}
              </Section>

              {!webtoon && (
                <Section title="Page layout">
                  <SegmentedControl
                    options={LAYOUT_OPTIONS}
                    value={pageLayout}
                    onChange={(v) => update({ pageLayout: v })}
                    size="sm"
                  />
                </Section>
              )}

              <Section title="Background">
                <div className="flex gap-4">
                  {BACKGROUNDS.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => update({ background: b.value })}
                      className="flex cursor-pointer flex-col items-center gap-1.5 text-[11px] text-white/60"
                    >
                      <span
                        className={cn(
                          'size-8 rounded-full border',
                          background === b.value ? 'border-accent ring-2 ring-accent/40' : 'border-white/25',
                        )}
                        style={{ background: READER_BACKGROUNDS[b.value] }}
                      />
                      {b.label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Behavior">
                <div className="space-y-3">
                  <Row label="Swipe gestures">
                    <Switch checked={swipe} onCheckedChange={(v) => update({ swipe: v })} label="Swipe gestures" />
                  </Row>
                  <Row label="Page turn animation">
                    <Switch
                      checked={animations}
                      onCheckedChange={(v) => update({ animations: v })}
                      label="Page turn animation"
                    />
                  </Row>
                  <Row label="Always fullscreen">
                    <Switch
                      checked={alwaysFullscreen}
                      onCheckedChange={onAlwaysFullscreenChange}
                      label="Always fullscreen"
                    />
                  </Row>
                </div>
              </Section>

              {webtoon && (
                <Section title="Webtoon">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px] text-white/80">
                        <span>Side padding</span>
                        <span className="font-mono text-xs text-white/50">{continuousPadding}%</span>
                      </div>
                      <Slider
                        value={continuousPadding}
                        onValueChange={(v) => update({ continuousPadding: v })}
                        min={0}
                        max={40}
                        step={5}
                        label="Side padding"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px] text-white/80">
                        <span>Page gap</span>
                        <span className="font-mono text-xs text-white/50">{continuousMargin}px</span>
                      </div>
                      <Slider
                        value={continuousMargin}
                        onValueChange={(v) => update({ continuousMargin: v })}
                        min={0}
                        max={15}
                        step={5}
                        label="Page gap"
                      />
                    </div>
                  </div>
                </Section>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
