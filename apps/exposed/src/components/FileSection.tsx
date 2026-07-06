import type { Section } from '#/lib/collect/types'
import Field from './Field'

type Props = {
  section: Section
  index: number
  revealed: boolean
}

// A tabbed manila section of the case file — numbered like an evidence exhibit.
export default function FileSection({ section, index, revealed }: Props) {
  const exhibit = String.fromCharCode(65 + index) // A, B, C, …

  return (
    <section
      id={section.id}
      className="scroll-mt-20 rounded-md border border-[var(--rule)] bg-[var(--card)]"
    >
      <header className="flex items-start gap-3 border-b border-[var(--rule)] px-4 py-3 sm:px-5">
        <span
          className="mono mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-[var(--stamp)] text-[0.72rem] font-semibold text-[var(--stamp)]"
          aria-hidden
        >
          {exhibit}
        </span>
        <div className="min-w-0">
          <h2 className="display text-[1.05rem] leading-tight text-[var(--ink)]">
            {section.title}
          </h2>
          <p className="mt-0.5 text-[0.82rem] leading-snug text-[var(--ink-soft)]">
            {section.blurb}
          </p>
        </div>
        <span className="mono ml-auto hidden shrink-0 text-[0.68rem] text-[var(--ink-faint)] sm:inline">
          {section.fields.filter((f) => f.value !== null).length}/{section.fields.length}
        </span>
      </header>
      <div className="px-4 py-1 sm:px-5">
        {section.fields.map((field) => (
          <Field key={field.key} field={field} revealed={revealed} />
        ))}
      </div>
    </section>
  )
}
