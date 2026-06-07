import { useStore } from '@tanstack/react-store'
import { notebookStore, actions, type Cell as CellT, type CellStatus } from '#/state/notebook'
import { RustEditor } from './codemirror/RustEditor'
import { CellOutput } from './CellOutput'
import { Button } from '@workspace/ui/button'
import { cancelCell, runCell } from '#/lib/runner'
import { cn } from '@workspace/ui/utils'

type Props = {
  cellId: string
}

type FigLabelProps = { index: number; status: CellStatus }
type StatusOrbProps = { status: CellStatus }
type CellFooterProps = { cell: CellT }

export function Cell({ cellId }: Props) {
  const cell = useStore(notebookStore, (s) => s.cells.find((c) => c.id === cellId))
  const sessionId = useStore(notebookStore, (s) => s.sessionId)
  if (!cell) return null

  const isBusy = cell.status === 'compiling' || cell.status === 'running'

  function run() {
    if (!cell) return
    void runCell({ sessionId, cellId: cell.id, source: cell.source })
  }
  function runAndAdd() {
    if (!cell) return
    run()
    actions.addCell(cell.id)
  }

  return (
    <article
      className={cn(
        'rise-in relative grid grid-cols-[3.25rem_minmax(0,1fr)] border-b border-[var(--rule)]',
        isBusy && 'is-running',
      )}
      onFocus={() => actions.setActive(cell.id)}
    >
      {/* gutter */}
      <aside className="cell-gutter relative flex flex-col items-center gap-3 border-r border-[var(--rule)] bg-[color:color-mix(in_oklab,var(--gutter)_60%,transparent)] py-4">
        <FigLabel index={cell.index} status={cell.status} />
        <StatusOrb status={cell.status} />
      </aside>

      <div className="min-w-0">
        {/* editor area */}
        <div className="group/editor relative h-[clamp(8rem,calc(min(40vh,38ch)),34rem)]">
          <RustEditor
            value={cell.source}
            onChange={(s) => actions.updateSource(cell.id, s)}
            onRun={run}
            onRunAndAdd={runAndAdd}
            disabled={isBusy}
          />

          {/* floating controls — visible on hover OR when active */}
          <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 opacity-0 transition group-hover/editor:opacity-100 group-focus-within/editor:opacity-100">
            <div className="pointer-events-auto flex items-center gap-1 rounded-sm border border-[var(--rule)] bg-[var(--surface-strong)] p-0.5 backdrop-blur">
              {!isBusy ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={run}
                  title="Run · Shift+Enter"
                  className="rounded-sm"
                >
                  <RunGlyph />
                  run
                </Button>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => cancelCell(cell.id)}
                  title="Stop"
                  className="rounded-sm"
                >
                  <StopGlyph />
                  stop
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.clearOutput(cell.id)}
                title="Clear output"
                className="rounded-sm"
                disabled={cell.output.length === 0}
              >
                clear
              </Button>
              <span className="mx-1 h-4 w-px bg-[var(--rule)]" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.removeCell(cell.id)}
                title="Delete cell"
                className="rounded-sm text-[var(--ink-faint)]"
              >
                ×
              </Button>
            </div>
          </div>
        </div>

        <CellOutput cell={cell} />

        <CellFooter cell={cell} />
      </div>
    </article>
  )
}

function FigLabel({ index, status }: FigLabelProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="kicker text-[0.55rem] text-[var(--ink-faint)]">fig.</span>
      <span
        className={cn(
          'display tabular text-[1.05rem] leading-none tracking-tight',
          status === 'error' ? 'text-[var(--stderr)]' : 'text-[var(--ink)]',
        )}
      >
        {String(index).padStart(2, '0')}
      </span>
    </div>
  )
}

function StatusOrb({ status }: StatusOrbProps) {
  const map: Record<CellStatus, { color: string; pulse: boolean; title: string }> = {
    idle:      { color: 'var(--ink-faint)',     pulse: false, title: 'idle' },
    compiling: { color: 'var(--ember)',          pulse: true,  title: 'compiling' },
    running:   { color: 'var(--ember)',          pulse: true,  title: 'running' },
    ok:        { color: 'var(--ok)',             pulse: false, title: 'ok' },
    error:     { color: 'var(--stderr)',         pulse: false, title: 'error' },
    stopped:   { color: 'var(--ink-faint)',     pulse: false, title: 'stopped' },
  }
  const { color, pulse, title } = map[status]
  return (
    <span
      title={title}
      className="relative inline-flex h-2 w-2"
      aria-label={title}
    >
      {pulse && (
        <span
          className="absolute inset-0 animate-ping rounded-full opacity-70"
          style={{ background: color }}
        />
      )}
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
    </span>
  )
}

function CellFooter({ cell }: CellFooterProps) {
  if (cell.status === 'idle' && cell.output.length === 0) return null
  const lines: string[] = []
  if (cell.durationMs != null) lines.push(`${cell.durationMs}ms`)
  if (cell.exitCode != null && cell.exitCode !== 0) lines.push(`exit ${cell.exitCode}`)
  return (
    <div className="flex items-center justify-between gap-3 border-t border-dashed border-[var(--rule)] px-5 py-2 text-[0.7rem] text-[var(--ink-faint)]">
      <div className="mono flex items-center gap-3 tabular">
        {cell.cacheHit && (
          <span className="stamp inline-flex items-center gap-1 text-[var(--ember)]">
            <span className="text-[0.65rem]">◉</span>
            <span className="kicker">cache hit</span>
          </span>
        )}
        {lines.length > 0 && (
          <span className="text-[var(--ink-soft)]">{lines.join(' · ')}</span>
        )}
      </div>
      <span className="mono text-[var(--ink-faint)]">{cell.status}</span>
    </div>
  )
}

function RunGlyph() {
  return (
    <svg width="9" height="10" viewBox="0 0 9 10" aria-hidden>
      <path d="M0 0 L9 5 L0 10 Z" fill="currentColor" />
    </svg>
  )
}
function StopGlyph() {
  return <span className="inline-block h-2 w-2 bg-current" aria-hidden />
}
