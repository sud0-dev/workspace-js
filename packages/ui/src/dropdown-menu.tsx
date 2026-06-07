// shadcn-style wrapper around @base-ui-components/react's Menu primitive.
// Component owned by us; primitive owned by Base UI.
import * as React from 'react'
import { Menu as BaseMenu } from '@base-ui-components/react/menu'
import { cn } from './utils'

export const DropdownMenu = BaseMenu.Root

export const DropdownMenuTrigger = BaseMenu.Trigger

type ContentProps = React.ComponentProps<typeof BaseMenu.Popup> & {
  className?: string
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

export function DropdownMenuContent({
  className,
  align = 'end',
  sideOffset = 6,
  children,
  ...props
}: ContentProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner align={align} sideOffset={sideOffset}>
        <BaseMenu.Popup
          className={cn(
            'z-50 min-w-[10rem] overflow-hidden rounded-md border border-[var(--rule)] bg-[var(--surface-strong)] p-1 shadow-[0_18px_44px_-12px_rgba(0,0,0,0.45)] outline-none backdrop-blur',
            'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
            'transition-opacity duration-150',
            className,
          )}
          {...props}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  )
}

type ItemProps = React.ComponentProps<typeof BaseMenu.Item> & {
  className?: string
  active?: boolean
}

export function DropdownMenuItem({
  className,
  active = false,
  children,
  ...props
}: ItemProps) {
  return (
    <BaseMenu.Item
      className={cn(
        'mono flex w-full cursor-pointer items-center gap-2.5 rounded px-3 py-2 text-left text-[0.78rem] outline-none transition-colors',
        active
          ? 'bg-[var(--ember-soft)] text-[var(--ink)]'
          : 'text-[var(--ink-soft)] data-[highlighted]:bg-[color:color-mix(in_oklab,var(--ember)_8%,transparent)] data-[highlighted]:text-[var(--ink)]',
        className,
      )}
      {...props}
    >
      {children}
    </BaseMenu.Item>
  )
}

// Convenience re-export for separators if needed later.
export const DropdownMenuSeparator = BaseMenu.Separator
