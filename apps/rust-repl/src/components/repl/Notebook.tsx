import { useEffect } from 'react'
import { useStore } from '@tanstack/react-store'
import { hydrateFromStorage, notebookStore, actions } from '#/state/notebook'
import { Cell } from './Cell'
import { NotebookToolbar } from './NotebookToolbar'
import { Button } from '#/components/ui/button'
import { registerSW } from '#/lib/registerSW'
import { consumeShareLink } from '#/lib/shareLink'
import { runBuildGate } from '#/lib/buildGate'

export function Notebook() {
  useEffect(() => {
    runBuildGate()
    hydrateFromStorage()
    const shared = consumeShareLink()
    if (shared) {
      const first = notebookStore.state.cells[0]
      if (first) actions.updateSource(first.id, shared)
    }
    registerSW()
  }, [])

  const cellIds = useStore(notebookStore, (s) => s.cells.map((c) => c.id))

  return (
    <div className="border-x border-[var(--rule)] bg-[var(--surface-strong)] backdrop-blur-sm">
      <NotebookToolbar />

      <div>
        {cellIds.map((id) => (
          <Cell key={id} cellId={id} />
        ))}
      </div>

      <AddCellFooter />
    </div>
  )
}

function AddCellFooter() {
  return (
    <div className="flex items-center justify-center gap-3 border-t border-dashed border-[var(--rule)] px-6 py-6">
      <Button variant="outline" size="md" onClick={() => actions.addCell()}>
        + new cell
      </Button>
    </div>
  )
}

// Skeleton must render the same HTML on server and first client paint.
export function NotebookSkeleton() {
  return (
    <div className="border-x border-[var(--rule)] bg-[var(--surface-strong)]">
      <div className="border-y border-[var(--rule)] px-6 py-2.5">
        <span className="display-italic text-[1.15rem] text-[var(--ink-faint)]">
          Loading notebook…
        </span>
      </div>
      <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] border-b border-[var(--rule)]">
        <aside className="border-r border-[var(--rule)] bg-[color:color-mix(in_oklab,var(--gutter)_60%,transparent)] py-4" />
        <div className="space-y-2 px-5 py-6">
          <div className="h-2 w-1/3 rounded bg-[var(--rule)]" />
          <div className="h-2 w-2/3 rounded bg-[var(--rule)]" />
          <div className="h-2 w-1/2 rounded bg-[var(--rule)]" />
        </div>
      </div>
    </div>
  )
}
