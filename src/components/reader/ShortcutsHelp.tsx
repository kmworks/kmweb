import { Dialog } from '@/components/ui/Dialog'

const GROUPS: { title: string; rows: [string, string][] }[] = [
  {
    title: 'Navigation',
    rows: [
      ['← / →', 'Turn page'],
      ['↑ / ↓', 'Turn page (vertical)'],
      ['Home / End', 'First / last page'],
      ['Space / PgUp / PgDn', 'Scroll (webtoon)'],
    ],
  },
  {
    title: 'Settings',
    rows: [
      ['L / R / V / W', 'Reading direction'],
      ['C', 'Cycle scale'],
      ['D', 'Cycle page layout'],
      ['P', 'Cycle side padding (webtoon)'],
      ['N', 'Cycle page gap (webtoon)'],
      ['F', 'Toggle fullscreen'],
    ],
  },
  {
    title: 'Menus',
    rows: [
      ['M', 'Toggle toolbars'],
      ['S', 'Settings'],
      ['T', 'Thumbnails'],
      ['H', 'This help'],
      ['Esc', 'Close / exit'],
    ],
  },
]

interface ShortcutsHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Keyboard shortcuts" size="lg">
      <div className="grid gap-6 p-5 md:grid-cols-3">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="mb-2 text-[11px] font-medium tracking-wide text-ink-3 uppercase">{group.title}</h3>
            <div className="space-y-1">
              {group.rows.map(([keys, description]) => (
                <div key={description} className="flex items-center justify-between gap-3 py-1">
                  <span className="text-[13px] text-ink-2">{description}</span>
                  <kbd className="rounded-md border border-line bg-raised px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap text-ink">
                    {keys}
                  </kbd>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Dialog>
  )
}
