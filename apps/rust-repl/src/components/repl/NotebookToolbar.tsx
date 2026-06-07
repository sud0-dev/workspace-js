import { useState } from 'react'
import { useStore } from '@tanstack/react-store'
import { notebookStore, actions } from '#/state/notebook'
import { Button } from '@workspace/ui/button'
import { buildShareLink } from '#/lib/shareLink'

export function NotebookToolbar() {
  const total = useStore(notebookStore, (s) => s.cells.length)
  const [copied, setCopied] = useState(false)

  function share() {
    const s = notebookStore.state
    const target = s.cells.find((c) => c.id === s.activeCellId) ?? s.cells[0]
    if (!target) return
    const url = buildShareLink(target.source)
    if (!url) return
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  }

  return (
    <div className="border-y border-[var(--rule)] bg-[var(--paper-tinted)]">
      <div className="flex items-center gap-4 px-6 py-2.5">
        <div className="flex items-baseline gap-2">
          <span className="display-italic text-[1.15rem] leading-none text-[var(--ink)]">
            Notebook
          </span>
          <span className="mono text-[0.7rem] text-[var(--ink-faint)] tabular">
            · {total} {total === 1 ? 'cell' : 'cells'}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={share}>
            {copied ? 'link copied' : 'share'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => actions.addCell()}>
            + cell
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Reset session? This clears all cells.')) actions.resetSession()
            }}
            className="text-[var(--ink-faint)]"
          >
            reset
          </Button>
        </div>
      </div>
    </div>
  )
}
