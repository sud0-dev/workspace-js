import type { Cell } from '#/state/notebook'
import { AnsiOutput } from './AnsiOutput'
import { cn } from '#/lib/utils'

type Props = { cell: Cell }
type OutputBlockProps = { chunk: Cell['output'][number] }

export function CellOutput({ cell }: Props) {
  if (cell.output.length === 0 && cell.status === 'idle') return null

  const isCompiling = cell.status === 'compiling'

  return (
    <div className="border-t border-[var(--rule)] bg-[color:color-mix(in_oklab,var(--paper-tinted)_60%,transparent)]">
      <div className="flex items-stretch">
        <div className="flex w-12 shrink-0 items-start justify-center border-r border-[var(--rule)] py-3">
          <span className="kicker mt-0.5 rotate-180 [writing-mode:vertical-rl] text-[0.55rem] text-[var(--ink-faint)]">
            output
          </span>
        </div>
        <div className="min-w-0 flex-1 py-3 pl-5 pr-6">
          {isCompiling && cell.output.length === 0 ? (
            <CompilingShimmer />
          ) : (
            <div className="mono space-y-1 text-[0.86rem] leading-[1.55] text-[var(--ink)]">
              {cell.output.map((chunk, i) => (
                <OutputBlock key={i} chunk={chunk} />
              ))}
              {cell.status === 'running' && <Caret />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function OutputBlock({ chunk }: OutputBlockProps) {
  if (chunk.stream === 'diagnostic') {
    const isErr = chunk.level === 'error'
    return (
      <div
        className={cn(
          'mt-1 rounded-[2px] border-l-2 px-3 py-2 text-[0.82rem]',
          isErr
            ? 'border-[var(--stderr)] bg-[color:color-mix(in_oklab,var(--stderr)_8%,transparent)]'
            : 'border-[var(--ember)] bg-[var(--ember-soft)]',
        )}
      >
        <div className="kicker mb-1 flex items-center gap-2">
          <span className={isErr ? 'text-[var(--stderr)]' : 'text-[var(--ember)]'}>
            {chunk.level}
          </span>
          <span className="text-[var(--ink-faint)]">·</span>
          <span className="text-[var(--ink-faint)]">rustc</span>
        </div>
        <pre className="mono whitespace-pre-wrap text-[0.82rem] leading-[1.5] text-[var(--ink)]">
          {chunk.text}
        </pre>
      </div>
    )
  }
  if (chunk.stream === 'stderr') {
    return (
      <span className="block text-[var(--stderr)]">
        <AnsiOutput text={chunk.text} />
      </span>
    )
  }
  if (chunk.stream === 'system') {
    return (
      <span className="block italic text-[var(--ink-faint)]">{chunk.text}</span>
    )
  }
  if (chunk.stream === 'result') {
    return (
      <span className="block text-[var(--ember)]">
        <span className="kicker mr-2 text-[var(--ink-faint)]">→</span>
        {chunk.text}
      </span>
    )
  }
  return <AnsiOutput text={chunk.text} />
}

function Caret() {
  return (
    <span
      aria-hidden
      className="inline-block h-[1em] w-[0.5ch] translate-y-[2px] animate-pulse bg-[var(--ember)]"
      style={{ animationDuration: '0.9s' }}
    />
  )
}

function CompilingShimmer() {
  return (
    <div className="flex items-center gap-3 text-[var(--ink-faint)]">
      <span className="relative inline-flex h-2 w-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-[var(--ember)] opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--ember)]" />
      </span>
      <span className="kicker">compiling · rustc → wasm32</span>
    </div>
  )
}
