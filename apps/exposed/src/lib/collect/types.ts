// ── Shared data model ────────────────────────────────────────────────────
// Every fact the page surfaces is a Field. Entropy encodes how identifying
// the value is (drives the fingerprint uniqueness estimate + the pip color).
// Status flags whether a value is benign, high-entropy, or an outright leak.

export enum Entropy {
  High = 'high',
  Med = 'med',
  Low = 'low',
}

export enum FieldStatus {
  Ok = 'ok',
  Warn = 'warn',
  Leak = 'leak',
}

export type Field = {
  key: string
  value: string | null // null = unavailable / blocked by the browser
  note?: string
  entropy?: Entropy
  status?: FieldStatus
  sensitive?: boolean // redacted in the hero until "declassified"
}

export type Section = {
  id: string
  title: string
  blurb: string
  fields: Field[]
}

// A permission-gated probe the visitor triggers by hand (GPS, clipboard, …).
export type Probe = {
  id: string
  label: string
  action: string
  description: string
}
