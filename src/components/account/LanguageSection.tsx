import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Section, SettingRow } from './Section'

export function LanguageSection() {
  const { t, i18n } = useTranslation('account')
  const current: LanguageCode = SUPPORTED_LANGUAGES.some((l) => l.code === i18n.language)
    ? (i18n.language as LanguageCode)
    : 'en'
  return (
    <Section title={t('language.title')}>
      <SettingRow label={t('language.label')}>
        <SegmentedControl<LanguageCode>
          options={SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
          value={current}
          onChange={(code) => void i18n.changeLanguage(code)}
        />
      </SettingRow>
    </Section>
  )
}
