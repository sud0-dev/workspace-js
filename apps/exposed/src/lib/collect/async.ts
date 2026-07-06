// Async client collectors — values that arrive via promise but still need no
// user gesture: connection info, storage quota, battery, media-device counts,
// permission states, and high-entropy UA Client Hints.

import { Entropy, FieldStatus, type Field, type Section } from './types'
import { bytes, str } from './format'

type ConnNav = Navigator & {
  connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean; type?: string }
  getBattery?: () => Promise<{ level: number; charging: boolean; chargingTime: number }>
  userAgentData?: { getHighEntropyValues?: (h: string[]) => Promise<Record<string, unknown>> }
}

// Network Information API + storage estimate + battery.
export async function collectConnection(): Promise<Section> {
  const n = navigator as ConnNav
  const c = n.connection
  const fields: Field[] = [
    { key: 'Connection type', value: str(c?.effectiveType ?? c?.type), note: 'Estimated link quality (4g, wifi, …).', entropy: Entropy.Low },
    { key: 'Downlink', value: c?.downlink ? `${c.downlink} Mbps` : null, entropy: Entropy.Low },
    { key: 'Latency (RTT)', value: typeof c?.rtt === 'number' ? `${c.rtt} ms` : null, entropy: Entropy.Low },
    { key: 'Data saver', value: str(c?.saveData), entropy: Entropy.Low },
  ]

  // Storage quota — reveals disk pressure and whether storage is persistent.
  try {
    const est = await navigator.storage?.estimate?.()
    if (est) {
      fields.push({ key: 'Storage quota', value: bytes(est.quota), note: 'How much this origin may store on your disk.', entropy: Entropy.Low })
      fields.push({ key: 'Storage used', value: bytes(est.usage), entropy: Entropy.Low })
    }
  } catch {
    /* not available */
  }

  // Battery — deprecated in many browsers, still exposed in some.
  try {
    if (n.getBattery) {
      const b = await n.getBattery()
      fields.push({
        key: 'Battery',
        value: `${Math.round(b.level * 100)}% · ${b.charging ? 'charging' : 'on battery'}`,
        note: 'Battery level was a known tracking vector — now restricted.',
        entropy: Entropy.Med,
        status: FieldStatus.Warn,
      })
    }
  } catch {
    /* blocked */
  }

  return {
    id: 'connection',
    title: 'Connection & storage',
    blurb: 'Link quality, disk quota, and — on some browsers — your battery level.',
    fields,
  }
}

const MEDIA_KINDS: Record<string, string> = {
  audioinput: 'Microphones',
  audiooutput: 'Speakers',
  videoinput: 'Cameras',
}

// Counts of connected media devices — visible before any permission grant.
export async function collectMedia(): Promise<Section> {
  const fields: Field[] = []
  try {
    const devices = await navigator.mediaDevices?.enumerateDevices?.()
    if (devices) {
      const counts: Record<string, number> = {}
      for (const d of devices) counts[d.kind] = (counts[d.kind] ?? 0) + 1
      for (const [kind, label] of Object.entries(MEDIA_KINDS)) {
        fields.push({ key: label, value: str(counts[kind] ?? 0), entropy: Entropy.Med })
      }
      fields.push({
        key: 'Labels exposed',
        value: devices.some((d) => d.label) ? 'Yes' : 'No (need permission)',
        note: 'Device names leak only after you grant camera/mic access.',
        entropy: Entropy.Low,
      })
    }
  } catch {
    /* unavailable */
  }
  if (!fields.length) fields.push({ key: 'Media devices', value: null, entropy: Entropy.Low })

  return {
    id: 'media',
    title: 'Media devices',
    blurb: 'How many cameras, mics, and speakers you have — countable without asking.',
    fields,
  }
}

const PERMISSION_NAMES = [
  'geolocation',
  'notifications',
  'camera',
  'microphone',
  'clipboard-read',
  'accelerometer',
  'gyroscope',
  'persistent-storage',
]

// Passively query the state of permissions without triggering a prompt.
export async function collectPermissions(): Promise<Section> {
  const fields: Field[] = []
  const perms = navigator.permissions
  if (perms?.query) {
    await Promise.all(
      PERMISSION_NAMES.map(async (name) => {
        try {
          const res = await perms.query({ name: name as PermissionName })
          fields.push({ key: name, value: res.state, status: res.state === 'granted' ? FieldStatus.Warn : FieldStatus.Ok, entropy: Entropy.Low })
        } catch {
          fields.push({ key: name, value: 'unsupported', entropy: Entropy.Low })
        }
      }),
    )
  }
  fields.sort((a, b) => a.key.localeCompare(b.key))
  if (!fields.length) fields.push({ key: 'Permissions API', value: null, entropy: Entropy.Low })

  return {
    id: 'permissions',
    title: 'Permission states',
    blurb: 'Sites can read which permissions you have already granted — silently.',
    fields,
  }
}

// UA Client Hints high-entropy values: model, architecture, OS version.
export async function collectClientHints(): Promise<Section | null> {
  const n = navigator as ConnNav
  const getHigh = n.userAgentData?.getHighEntropyValues
  if (!getHigh) return null
  try {
    const hv = await getHigh.call(n.userAgentData, [
      'architecture',
      'bitness',
      'model',
      'platformVersion',
      'fullVersionList',
      'uaFullVersion',
    ])
    const versions = Array.isArray(hv.fullVersionList)
      ? (hv.fullVersionList as { brand: string; version: string }[]).map((b) => `${b.brand} ${b.version}`).join(', ')
      : null
    const fields: Field[] = [
      { key: 'Architecture', value: str(hv.architecture), entropy: Entropy.Med },
      { key: 'Bitness', value: str(hv.bitness), entropy: Entropy.Low },
      { key: 'Device model', value: str(hv.model), note: 'Empty on desktop; names the handset on mobile.', entropy: Entropy.High },
      { key: 'OS version', value: str(hv.platformVersion), entropy: Entropy.Med },
      { key: 'Full versions', value: versions, entropy: Entropy.Med },
    ]
    return {
      id: 'hints',
      title: 'Client Hints (high-entropy)',
      blurb: 'Ask nicely and Chromium hands over your exact OS version and device model.',
      fields,
    }
  } catch {
    return null
  }
}
