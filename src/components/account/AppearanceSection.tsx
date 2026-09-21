import { useUiStore, type CardStyle, type GridDensity, type Theme } from '@/lib/store/ui'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Switch } from '@/components/ui/Switch'
import { Section, SettingRow } from './Section'

export function AppearanceSection() {
  const theme = useUiStore((s) => s.theme)
  const cardStyle = useUiStore((s) => s.cardStyle)
  const gridDensity = useUiStore((s) => s.gridDensity)
  const blurUnreadCovers = useUiStore((s) => s.blurUnreadCovers)
  const setTheme = useUiStore((s) => s.setTheme)
  const setCardStyle = useUiStore((s) => s.setCardStyle)
  const setGridDensity = useUiStore((s) => s.setGridDensity)
  const setBlurUnreadCovers = useUiStore((s) => s.setBlurUnreadCovers)

  return (
    <Section title="Appearance">
      <div className="flex flex-col divide-y divide-line">
        <SettingRow label="Theme">
          <SegmentedControl<Theme>
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            value={theme}
            onChange={setTheme}
          />
        </SettingRow>
        <SettingRow label="Card style">
          <SegmentedControl<CardStyle>
            options={[
              { value: 'standard', label: 'Standard' },
              { value: 'overlay', label: 'Overlay' },
              { value: 'cover', label: 'Cover only' },
            ]}
            value={cardStyle}
            onChange={setCardStyle}
          />
        </SettingRow>
        <SettingRow label="Grid density">
          <SegmentedControl<GridDensity>
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'standard', label: 'Standard' },
              { value: 'cozy', label: 'Cozy' },
            ]}
            value={gridDensity}
            onChange={setGridDensity}
          />
        </SettingRow>
        <SettingRow label="Blur covers of unread series and books">
          <Switch
            checked={blurUnreadCovers}
            onCheckedChange={setBlurUnreadCovers}
            label="Blur covers of unread series and books"
          />
        </SettingRow>
      </div>
    </Section>
  )
}
