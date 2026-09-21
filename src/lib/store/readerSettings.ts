import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReadingDirection } from '@/lib/api/types'
import type { PagedReaderLayout } from '@/lib/utils/spreads'

export type ScaleType = 'SCREEN' | 'WIDTH' | 'WIDTH_SHRINK_ONLY' | 'HEIGHT' | 'ORIGINAL'
export type ContinuousScaleType = 'WIDTH' | 'ORIGINAL'
export type ReaderBackground = 'BLACK' | 'GRAY' | 'WHITE'

interface ReaderSettings {
  scale: ScaleType
  pageLayout: PagedReaderLayout
  continuousScale: ContinuousScaleType
  /** side padding percent, 0-40 step 5 */
  continuousPadding: number
  /** gap between pages in px */
  continuousMargin: number
  readingDirection: ReadingDirection
  swipe: boolean
  animations: boolean
  alwaysFullscreen: boolean
  background: ReaderBackground
}

interface ReaderSettingsState extends ReaderSettings {
  update: (patch: Partial<ReaderSettings>) => void
}

export const READER_BACKGROUNDS: Record<ReaderBackground, string> = {
  BLACK: '#000000',
  GRAY: '#161618',
  WHITE: '#f5f4f0',
}

export const useReaderSettings = create<ReaderSettingsState>()(
  persist(
    (set) => ({
      scale: 'SCREEN',
      pageLayout: 'SINGLE_PAGE',
      continuousScale: 'WIDTH',
      continuousPadding: 0,
      continuousMargin: 0,
      readingDirection: 'LEFT_TO_RIGHT',
      swipe: true,
      animations: true,
      alwaysFullscreen: false,
      background: 'BLACK',
      update: (patch) => set(patch),
    }),
    { name: 'kmweb.reader' },
  ),
)
