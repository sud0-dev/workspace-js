import Anser from 'anser'
import { useMemo } from 'react'

type Props = { text: string }

export function AnsiOutput({ text }: Props) {
  const segments = useMemo(
    () => Anser.ansiToJson(text, { use_classes: true, json: true, remove_empty: true }),
    [text],
  )
  return (
    <span className="ansi">
      {segments.map((s, i) => {
        const classes = [
          s.fg ? `ansi-${s.fg.replace('ansi-', '')}` : '',
          s.bg ? `ansi-bg-${s.bg.replace('ansi-', '')}` : '',
          ...(s.decorations ?? []).map((d) => `ansi-${d}`),
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <span key={i} className={classes || undefined}>
            {s.content}
          </span>
        )
      })}
    </span>
  )
}
