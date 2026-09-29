import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowCounterClockwise, DotsThreeVertical, PlugsConnected } from '@phosphor-icons/react'
import { komfApi } from '@/lib/api/komf'
import { showToast } from '@/lib/store/toast'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { KomfResetDialog } from '@/components/metadata/KomfResetDialog'

interface LibraryKomfMenuProps {
  libraryId: string
  libraryName: string
}

export function LibraryKomfMenu({ libraryId, libraryName }: LibraryKomfMenuProps) {
  const { t } = useTranslation('browse')
  const queryClient = useQueryClient()
  const [resetOpen, setResetOpen] = useState(false)

  const matchMutation = useMutation({
    mutationFn: () => komfApi.matchLibrary(libraryId),
    onSuccess: () => showToast(t('library.matchQueued')),
    onError: (e) => showToast(e instanceof Error ? e.message : t('library.queueMatchFailed')),
  })
  const resetMutation = useMutation({
    mutationFn: () => komfApi.resetLibrary(libraryId),
    onSuccess: () => {
      setResetOpen(false)
      queryClient.invalidateQueries({ queryKey: ['series'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      showToast(t('library.metadataReset'))
    },
    onError: (e) => showToast(e instanceof Error ? e.message : t('library.resetMetadataFailed')),
  })

  return (
    <>
      <Menu
        trigger={
          <IconButton label={t('library.moreActions')}>
            <DotsThreeVertical className="size-5" />
          </IconButton>
        }
      >
        <MenuItem onSelect={() => matchMutation.mutate()} disabled={matchMutation.isPending}>
          <PlugsConnected className="size-4" /> {t('library.matchKomf')}
        </MenuItem>
        <MenuItem onSelect={() => setResetOpen(true)}>
          <ArrowCounterClockwise className="size-4" /> {t('library.resetKomf')}
        </MenuItem>
      </Menu>
      <KomfResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        name={libraryName}
        bodyKey="reset.libraryBody"
        loading={resetMutation.isPending}
        onConfirm={() => resetMutation.mutate()}
      />
    </>
  )
}
