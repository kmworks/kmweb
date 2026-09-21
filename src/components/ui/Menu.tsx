import * as RadixMenu from '@radix-ui/react-dropdown-menu'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface MenuProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Menu({ trigger, children, align = 'end', side = 'bottom' }: MenuProps) {
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align={align}
          side={side}
          sideOffset={6}
          className={cn(
            'z-30 min-w-44 overflow-hidden rounded-xl border border-line bg-raised p-1 shadow-pop',
            'data-[state=open]:animate-[fade-in_0.12s_ease-out]',
          )}
        >
          {children}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  )
}

export function MenuItem({
  children,
  onSelect,
  danger,
  disabled,
}: {
  children: ReactNode
  onSelect?: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <RadixMenu.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors outline-none select-none',
        danger
          ? 'text-danger data-[highlighted]:bg-danger/10'
          : 'text-ink data-[highlighted]:bg-accent-soft data-[highlighted]:text-accent-strong',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      )}
    >
      {children}
    </RadixMenu.Item>
  )
}

export function MenuSeparator() {
  return <RadixMenu.Separator className="mx-1 my-1 h-px bg-line" />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <RadixMenu.Label className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-wide text-ink-3 uppercase">
      {children}
    </RadixMenu.Label>
  )
}
