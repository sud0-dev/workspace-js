import { Entropy, FieldStatus, type Field as FieldType } from '#/lib/collect/types'

type Props = {
  field: FieldType
  revealed: boolean
}

const ENTROPY_LABEL: Record<Entropy, string> = {
  [Entropy.High]: 'high',
  [Entropy.Med]: 'medium',
  [Entropy.Low]: 'low',
}

const STATUS_COLOR: Record<FieldStatus, string> = {
  [FieldStatus.Ok]: 'var(--signal)',
  [FieldStatus.Warn]: 'var(--warn)',
  [FieldStatus.Leak]: 'var(--stamp)',
}

// One row of the dossier: a labelled fact the browser gave up.
export default function Field({ field, revealed }: Props) {
  const { key, value, note, entropy, status, sensitive } = field
  const missing = value === null
  const redacted = Boolean(sensitive) && !revealed

  return (
    <div className="field">
      <div className="field-key">
        {key}
        {entropy ? (
          <span
            className={`pip pip-${entropy}`}
            title={`Fingerprint weight: ${ENTROPY_LABEL[entropy]}`}
            aria-hidden
          />
        ) : null}
      </div>
      <div>
        {missing ? (
          <span className="field-val" style={{ color: 'var(--ink-faint)' }}>
            — not exposed
          </span>
        ) : (
          <span className="redact" data-open={!redacted}>
            <span
              className="field-val redact-val"
              style={status ? { color: STATUS_COLOR[status] } : undefined}
            >
              {value}
            </span>
          </span>
        )}
        {note ? (
          <p className="mt-1 max-w-[46ch] text-[0.78rem] leading-snug text-[var(--ink-soft)]">
            {note}
          </p>
        ) : null}
      </div>
    </div>
  )
}
