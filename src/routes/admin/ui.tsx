import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { WarningCircle } from '@phosphor-icons/react'
import { clientSettingsApi } from '@/lib/api/clientSettings'
import { usersApi } from '@/lib/api/users'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { Section } from '@/components/account/Section'

// server-side keys must be all-lowercase dotted segments
export const HIDE_PASSWORD_KEY = 'webui.login.hide-password'

export function AdminUiPage() {
  const queryClient = useQueryClient()

  useEffect(() => {
    document.title = 'UI settings · KMReader'
  }, [])

  const settingsQuery = useQuery({ queryKey: ['admin', 'client-settings', 'global'], queryFn: clientSettingsApi.listGlobal })
  // shown only as context: the toggle is a no-op without providers
  const providersQuery = useQuery({ queryKey: ['oauth2-providers'], queryFn: usersApi.oauth2Providers })

  const hidePassword = settingsQuery.data?.[HIDE_PASSWORD_KEY]?.value === 'true'
  const providerCount = providersQuery.data?.length ?? 0

  const save = useMutation({
    mutationFn: (hide: boolean) =>
      clientSettingsApi.saveGlobal({
        // allowUnauthorized: the login page is anonymous and must be able to read this
        [HIDE_PASSWORD_KEY]: { value: String(hide), allowUnauthorized: true },
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'client-settings', 'global'] }),
  })

  return (
    <div className="max-w-3xl">
      <PageHeader title="UI settings" subtitle="Global tweaks applied to every user's web UI" />

      {settingsQuery.isPending ? (
        <Skeleton className="h-28 rounded-xl" />
      ) : settingsQuery.isError ? (
        <EmptyState
          icon={<WarningCircle />}
          title="Couldn't load UI settings"
          body={settingsQuery.error instanceof Error ? settingsQuery.error.message : 'Something went wrong.'}
          action={<Button onClick={() => settingsQuery.refetch()}>Retry</Button>}
        />
      ) : (
        <Section title="Login">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5">
            <div className="min-w-0 max-w-md">
              <p className="text-sm text-ink-2">Hide email/password login form</p>
              <p className="mt-0.5 text-xs text-ink-3">
                Only takes effect when at least one OAuth2 provider is configured
                {providersQuery.data ? ` (${providerCount} configured)` : ''}. Without one, the password form always
                shows so nobody gets locked out.
              </p>
            </div>
            <Switch
              checked={hidePassword}
              onCheckedChange={(v) => save.mutate(v)}
              disabled={save.isPending}
              label="Hide email/password login form"
            />
          </div>
          {hidePassword && providersQuery.data && providerCount === 0 && (
            <p className="mt-3 text-xs text-accent-strong">
              No OAuth2 provider is configured, so the password form still shows on the login page.
            </p>
          )}
          {save.isError && (
            <p className="mt-3 text-sm text-danger">
              {save.error instanceof Error ? save.error.message : 'Could not save the setting.'}
            </p>
          )}
        </Section>
      )}
    </div>
  )
}
