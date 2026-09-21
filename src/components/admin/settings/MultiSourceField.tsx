import { ArrowCounterClockwise } from '@phosphor-icons/react'
import type { SettingMultiSource } from '@/lib/api/types'
import { Chip } from '@/components/ui/Chip'
import { IconButton } from '@/components/ui/IconButton'
import { Tooltip } from '@/components/ui/Tooltip'
import { FieldInput } from './FieldInput'

interface MultiSourceFieldProps<T extends string | number> {
  ariaLabel: string
  source?: SettingMultiSource<T>
  value: string
  onChange: (v: string) => void
  error?: string
  inputMode?: 'numeric' | 'text'
}

/** Edits the database override of a multi-source setting; config-file/default values stay read-only. */
export function MultiSourceField<T extends string | number>({
  ariaLabel,
  source,
  value,
  onChange,
  error,
  inputMode,
}: MultiSourceFieldProps<T>) {
  const overridden = source?.databaseSource != null
  const fromConfig = !overridden && source?.configurationSource != null
  const effective = source?.effectiveValue
  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <FieldInput
          aria-label={ariaLabel}
          className="w-36"
          inputMode={inputMode}
          placeholder={source?.configurationSource?.toString() ?? 'Not set'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          invalid={!!error}
        />
        {overridden ? (
          <>
            <Chip className="border-accent/40 bg-accent-soft text-accent-strong">Overridden in database</Chip>
            <Tooltip content="Clear the database override">
              <IconButton label="Clear override" className="size-8" onClick={() => onChange('')}>
                <ArrowCounterClockwise className="size-4" />
              </IconButton>
            </Tooltip>
          </>
        ) : fromConfig ? (
          <Chip>From configuration</Chip>
        ) : (
          <Chip>Default</Chip>
        )}
      </div>
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        <p className="text-xs text-ink-3">Effective: {effective != null && effective !== '' ? String(effective) : 'none'}</p>
      )}
    </div>
  )
}
