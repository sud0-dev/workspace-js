// Orchestrator — runs every client collector and computes a fingerprint
// uniqueness estimate from the high-entropy fields that came back populated.

import { Entropy, type Field, type Section } from './types'
import { fnv1a } from './format'
import { collectDevice, collectScreen, collectLocale, collectPreferences } from './sync'
import { collectFingerprint } from './fingerprint'
import { collectConnection, collectMedia, collectPermissions, collectClientHints } from './async'
import { collectWebRtc } from './webrtc'

export type ClientReport = {
  sections: Section[]
  fingerprint: string // combined digest of all high-entropy fields
  bitsOfEntropy: number // rough identifying-information estimate
}

// Weight each populated field by how identifying it is.
const ENTROPY_BITS: Record<Entropy, number> = {
  [Entropy.High]: 3.2,
  [Entropy.Med]: 1.3,
  [Entropy.Low]: 0.35,
}

function scoreEntropy(sections: Section[]): { digest: string; bits: number } {
  const parts: string[] = []
  let bits = 0
  for (const section of sections) {
    for (const f of section.fields) {
      if (f.value === null) continue
      if (f.entropy) bits += ENTROPY_BITS[f.entropy]
      if (f.entropy === Entropy.High) parts.push(`${f.key}=${f.value}`)
    }
  }
  return { digest: fnv1a(parts.join('|')), bits: Math.round(bits * 10) / 10 }
}

// Collect everything the browser exposes without a user gesture.
export async function runClientCollection(): Promise<ClientReport> {
  const syncSections = [collectDevice(), collectScreen(), collectLocale(), collectPreferences()]

  const asyncSections = await Promise.all([
    collectFingerprint(),
    collectConnection(),
    collectMedia(),
    collectPermissions(),
    collectClientHints(),
    collectWebRtc(),
  ])

  const sections = [...syncSections, ...asyncSections.filter((s): s is Section => s !== null)]
  const { digest, bits } = scoreEntropy(sections)

  return { sections, fingerprint: digest, bitsOfEntropy: bits }
}

export type { Field, Section }
