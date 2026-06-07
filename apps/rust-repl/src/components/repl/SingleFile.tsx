import { useEffect, useState } from 'react'
import { useStore } from '@tanstack/react-store'
import { hydrateScratch, scratchActions, scratchStore } from '#/state/scratch'
import { RustEditor } from './codemirror/RustEditor'
import { CellOutput } from './CellOutput'
import { Button } from '#/components/ui/button'
import { cancelScratch, runScratch } from '#/lib/runner'
import { buildShareLink, consumeShareLink } from '#/lib/shareLink'
import { registerSW } from '#/lib/registerSW'
import { runBuildGate } from '#/lib/buildGate'

const SESSION_ID = 's_scratch'

export function SingleFile() {
  const state = useStore(scratchStore)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    runBuildGate()
    hydrateScratch()
    const shared = consumeShareLink()
    if (shared) scratchActions.updateSource(shared)
    registerSW()
  }, [])

  const busy = state.status === 'compiling' || state.status === 'running'

  function run() {
    void runScratch({ sessionId: SESSION_ID, source: scratchStore.state.source })
  }

  function share() {
    const url = buildShareLink(scratchStore.state.source)
    if (!url) return
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  }

  return (
    <div className="overflow-hidden border-x border-[var(--rule)] bg-[var(--surface-strong)] backdrop-blur-sm">
      <Toolbar
        busy={busy}
        copied={copied}
        onRun={run}
        onStop={() => cancelScratch()}
        onShare={share}
        onClear={() => scratchActions.clearOutput()}
        onReset={() => {
          if (confirm('Reset editor? This clears your source.')) scratchActions.reset()
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="border-b border-[var(--rule)] lg:border-b-0 lg:border-r">
          <RustEditor
            value={state.source}
            onChange={scratchActions.updateSource}
            onRun={run}
            onRunAndAdd={run}
            disabled={busy}
          />
        </div>

        <OutputPanel />
      </div>

      <StatusBar />
    </div>
  )
}

type ToolbarProps = {
  busy: boolean
  copied: boolean
  onRun: () => void
  onStop: () => void
  onShare: () => void
  onClear: () => void
  onReset: () => void
}

function Toolbar({ busy, copied, onRun, onStop, onShare, onClear, onReset }: ToolbarProps) {
  return (
    <div className="sticky top-14 z-20 -mx-px flex items-center gap-3 border-y border-[var(--rule)] bg-[color-mix(in_oklab,var(--paper)_92%,transparent)] px-6 py-2.5 backdrop-blur">
      <div className="flex items-baseline gap-2">
        <span className="display-italic text-[1.15rem] leading-none text-[var(--ink)]">
          Editor
        </span>
        <span className="mono text-[0.7rem] text-[var(--ink-faint)]">· single file</span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {busy ? (
          <Button variant="danger" size="sm" onClick={onStop}>
            stop
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={onRun}>
            ▶ run
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onShare}>
          {copied ? 'link copied' : 'share'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-[var(--ink-faint)]">
          clear
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset} className="text-[var(--ink-faint)]">
          reset
        </Button>
      </div>
    </div>
  )
}

function OutputPanel() {
  const state = useStore(scratchStore)

  if (state.output.length === 0 && state.status === 'idle') {
    return (
      <div className="flex items-center justify-center bg-[color:color-mix(in_oklab,var(--paper-tinted)_60%,transparent)] p-10 text-[var(--ink-faint)]">
        <p className="kicker max-w-[28ch] text-center">
          press ⇧↵ in the editor — output streams here
        </p>
      </div>
    )
  }

  // Reuse CellOutput by mapping scratch shape into a Cell-shaped object.
  const cellLike = {
    id: '_scratch',
    index: 0,
    source: state.source,
    status: state.status,
    output: state.output,
    startedAt: state.startedAt,
    durationMs: state.durationMs,
    cacheHit: state.cacheHit,
    exitCode: state.exitCode,
  }
  return <CellOutput cell={cellLike} />
}

function StatusBar() {
  const state = useStore(scratchStore)
  const parts: string[] = []
  if (state.durationMs != null) parts.push(`${state.durationMs}ms`)
  if (state.exitCode != null) parts.push(`exit ${state.exitCode}`)
  if (parts.length === 0 && state.status === 'idle') {
    return (
      <div className="border-t border-dashed border-[var(--rule)] px-6 py-2 text-[0.7rem] text-[var(--ink-faint)]" />
    )
  }
  return (
    <div className="flex items-center justify-between gap-3 border-t border-dashed border-[var(--rule)] px-6 py-2 text-[0.7rem] text-[var(--ink-faint)]">
      <div className="mono flex items-center gap-3 tabular">
        {state.cacheHit && (
          <span className="stamp inline-flex items-center gap-1 text-[var(--ember)]">
            <span className="text-[0.65rem]">◉</span>
            <span className="kicker">cache hit</span>
          </span>
        )}
        {parts.length > 0 && <span className="text-[var(--ink-soft)]">{parts.join(' · ')}</span>}
      </div>
      <span className="mono text-[var(--ink-faint)]">{state.status}</span>
    </div>
  )
}

export function SingleFileSkeleton() {
  return (
    <div className="border-x border-[var(--rule)] bg-[var(--surface-strong)]">
      <div className="border-y border-[var(--rule)] px-6 py-2.5">
        <span className="display-italic text-[1.15rem] text-[var(--ink-faint)]">
          Loading editor…
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-2 border-r border-[var(--rule)] px-5 py-6">
          <div className="h-2 w-1/3 rounded bg-[var(--rule)]" />
          <div className="h-2 w-2/3 rounded bg-[var(--rule)]" />
          <div className="h-2 w-1/2 rounded bg-[var(--rule)]" />
        </div>
        <div className="p-6" />
      </div>
    </div>
  )
}

