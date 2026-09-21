import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  BookOpen,
  CornersIn,
  CornersOut,
  DotsThreeVertical,
  Download,
  EyeSlash,
  Question,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  SquaresFour,
  X,
} from '@phosphor-icons/react'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { Slider } from '@/components/ui/Slider'
import { Tooltip } from '@/components/ui/Tooltip'

interface ReaderChromeProps {
  visible: boolean
  title: string
  page: number
  pagesCount: number
  rtl: boolean
  incognito: boolean
  isFullscreen: boolean
  canDownloadFile: boolean
  hasPreviousBook: boolean
  hasNextBook: boolean
  onClose: () => void
  onGoToPage: (page: number) => void
  onFirstPage: () => void
  onLastPage: () => void
  onPreviousBook: () => void
  onNextBook: () => void
  onToggleExplorer: () => void
  onToggleSettings: () => void
  onToggleHelp: () => void
  onToggleFullscreen: () => void
  onDownload: () => void
  onGoToBook: () => void
}

const chromeButton = 'text-white/85 hover:bg-white/10 hover:text-white'

export function ReaderChrome({
  visible,
  title,
  page,
  pagesCount,
  rtl,
  incognito,
  isFullscreen,
  canDownloadFile,
  hasPreviousBook,
  hasNextBook,
  onClose,
  onGoToPage,
  onFirstPage,
  onLastPage,
  onPreviousBook,
  onNextBook,
  onToggleExplorer,
  onToggleSettings,
  onToggleHelp,
  onToggleFullscreen,
  onDownload,
  onGoToBook,
}: ReaderChromeProps) {
  const reduceMotion = useReducedMotion()
  const transition = { duration: reduceMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] as const }

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="top"
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={transition}
            className="fixed inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent"
          >
            <div className="flex items-center gap-0.5 px-2 pt-2 pb-10 text-white">
              <IconButton label="Close reader" className={chromeButton} onClick={onClose}>
                <X className="size-5" />
              </IconButton>
              <div className="flex min-w-0 flex-1 justify-center px-2">
                <span className="max-w-full truncate rounded-full bg-black/40 px-3 py-1 text-[13px] text-white/90">
                  {title}
                </span>
              </div>
              {incognito && (
                <Tooltip content="Incognito: progress is not saved" side="bottom">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center text-white/70">
                    <EyeSlash className="size-5" />
                  </span>
                </Tooltip>
              )}
              <IconButton label="Pages" className={chromeButton} onClick={onToggleExplorer}>
                <SquaresFour className="size-5" />
              </IconButton>
              <IconButton label="Settings" className={chromeButton} onClick={onToggleSettings}>
                <SlidersHorizontal className="size-5" />
              </IconButton>
              <IconButton label="Keyboard shortcuts" className={chromeButton} onClick={onToggleHelp}>
                <Question className="size-5" />
              </IconButton>
              <IconButton
                label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                className={chromeButton}
                onClick={onToggleFullscreen}
              >
                {isFullscreen ? <CornersIn className="size-5" /> : <CornersOut className="size-5" />}
              </IconButton>
              <Menu
                trigger={
                  <IconButton label="More" className={chromeButton}>
                    <DotsThreeVertical className="size-5" />
                  </IconButton>
                }
              >
                {canDownloadFile && (
                  <MenuItem onSelect={onDownload}>
                    <Download className="size-4" /> Download file
                  </MenuItem>
                )}
                <MenuItem onSelect={onGoToBook}>
                  <BookOpen className="size-4" /> Go to book page
                </MenuItem>
              </Menu>
            </div>
          </motion.div>
        )}
        {visible && (
          <motion.div
            key="bottom"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={transition}
            className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/70 to-transparent"
          >
            <div dir={rtl ? 'rtl' : 'ltr'} className="flex items-center gap-1.5 px-3 pt-10 pb-3 text-white">
              <IconButton
                label="Previous book"
                className={chromeButton}
                disabled={!hasPreviousBook}
                onClick={onPreviousBook}
              >
                <ArrowUUpLeft className="size-5" />
              </IconButton>
              <IconButton label="First page" className={chromeButton} onClick={onFirstPage}>
                <SkipBack className="size-5" />
              </IconButton>
              <div className="min-w-0 flex-1 px-2">
                <Slider value={page} onValueChange={onGoToPage} min={1} max={pagesCount} label="Page" dir={rtl ? 'rtl' : 'ltr'} />
              </div>
              <span className="shrink-0 font-mono text-xs text-white/80 tabular-nums" dir="ltr">
                {page} / {pagesCount}
              </span>
              <IconButton label="Last page" className={chromeButton} onClick={onLastPage}>
                <SkipForward className="size-5" />
              </IconButton>
              <IconButton label="Next book" className={chromeButton} disabled={!hasNextBook} onClick={onNextBook}>
                <ArrowUUpRight className="size-5" />
              </IconButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!visible && (
        <div dir={rtl ? 'rtl' : 'ltr'} className="fixed inset-x-0 bottom-0 z-20 h-0.5 bg-white/10">
          <div className="h-full bg-accent" style={{ width: `${(page / pagesCount) * 100}%` }} />
        </div>
      )}
    </>
  )
}
