import {
  Group,
  Panel,
  Separator,
  type GroupProps,
  type PanelProps,
  type SeparatorProps,
} from 'react-resizable-panels'
import { cn } from '@workspace/ui/utils'

type GProps = GroupProps & { className?: string }
export function ResizablePanelGroup({ className, ...props }: GProps) {
  return <Group className={cn('flex h-full w-full', className)} {...props} />
}

type PProps = PanelProps & { className?: string }
export function ResizablePanel({ className, ...props }: PProps) {
  return <Panel className={cn('min-h-0 min-w-0', className)} {...props} />
}

type HProps = SeparatorProps & {
  className?: string
  withGrip?: boolean
}
export function ResizableHandle({ className, withGrip = true, ...props }: HProps) {
  return (
    <Separator
      className={cn(
        'group/handle relative flex w-2 shrink-0 cursor-col-resize items-center justify-center bg-[var(--rule)] transition-colors',
        'hover:bg-[var(--ember)] data-[active=true]:bg-[var(--ember)]',
        '[[data-group][data-orientation="vertical"]_&]:h-2 [[data-group][data-orientation="vertical"]_&]:w-full [[data-group][data-orientation="vertical"]_&]:cursor-row-resize',
        className,
      )}
      {...props}
    >
      {withGrip && (
        <span
          aria-hidden
          className="pointer-events-none flex flex-col items-center gap-0.5 opacity-40 transition group-hover/handle:opacity-100"
        >
          <span className="h-0.5 w-0.5 rounded-full bg-[var(--paper)]" />
          <span className="h-0.5 w-0.5 rounded-full bg-[var(--paper)]" />
          <span className="h-0.5 w-0.5 rounded-full bg-[var(--paper)]" />
        </span>
      )}
    </Separator>
  )
}
