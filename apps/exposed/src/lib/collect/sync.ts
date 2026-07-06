// Synchronous client collectors — everything readable without a promise or a
// permission prompt. These run the instant the page hydrates.

import { Entropy, FieldStatus, type Field, type Section } from './types'
import { str } from './format'

type Nav = Navigator & {
  deviceMemory?: number
  userAgentData?: { platform?: string; mobile?: boolean; brands?: { brand: string; version: string }[] }
  globalPrivacyControl?: boolean
  pdfViewerEnabled?: boolean
}

// The browser identity string, platform, cores, memory, input capability.
export function collectDevice(): Section {
  const n = navigator as Nav
  const uaData = n.userAgentData
  const brands = uaData?.brands?.map((b) => `${b.brand} ${b.version}`).join(', ')

  const fields: Field[] = [
    { key: 'Platform', value: str(uaData?.platform ?? n.platform), entropy: Entropy.Med },
    { key: 'Engine hint', value: str(brands), note: 'Client Hints brand list.', entropy: Entropy.Med },
    { key: 'Mobile', value: str(uaData?.mobile), entropy: Entropy.Low },
    {
      key: 'CPU cores',
      value: str(n.hardwareConcurrency),
      note: 'Logical processors — exposed with no permission.',
      entropy: Entropy.Med,
    },
    {
      key: 'Device memory',
      value: n.deviceMemory ? `${n.deviceMemory} GB (approx)` : null,
      entropy: Entropy.Med,
    },
    {
      key: 'Touch points',
      value: str(n.maxTouchPoints),
      note: 'Max simultaneous touches — distinguishes phone from desktop.',
      entropy: Entropy.Low,
    },
    { key: 'Cookies enabled', value: str(n.cookieEnabled), entropy: Entropy.Low },
    {
      key: 'PDF viewer',
      value: str(n.pdfViewerEnabled),
      entropy: Entropy.Low,
    },
    {
      key: 'Automation flag',
      value: str(n.webdriver),
      note: 'True when a bot / headless driver is in control.',
      status: n.webdriver ? FieldStatus.Warn : FieldStatus.Ok,
      entropy: Entropy.Low,
    },
  ]

  return {
    id: 'device',
    title: 'Device & hardware',
    blurb: 'Your machine describes itself in detail — core count and memory included.',
    fields,
  }
}

// Screen geometry, pixel density, color depth, window size.
export function collectScreen(): Section {
  const s = screen
  const orientation = (s as Screen & { orientation?: { type?: string } }).orientation?.type

  const fields: Field[] = [
    {
      key: 'Screen',
      value: `${s.width} × ${s.height}`,
      note: 'Full display resolution.',
      entropy: Entropy.Med,
    },
    { key: 'Available', value: `${s.availWidth} × ${s.availHeight}`, entropy: Entropy.Med },
    { key: 'Viewport', value: `${window.innerWidth} × ${window.innerHeight}`, entropy: Entropy.Low },
    {
      key: 'Pixel ratio',
      value: str(window.devicePixelRatio),
      note: 'Retina / scaling factor — narrows the device model.',
      entropy: Entropy.Med,
    },
    { key: 'Color depth', value: `${s.colorDepth}-bit`, entropy: Entropy.Low },
    { key: 'Orientation', value: str(orientation), entropy: Entropy.Low },
  ]

  return {
    id: 'screen',
    title: 'Screen & display',
    blurb: 'Resolution and pixel density combine into a surprisingly rare signature.',
    fields,
  }
}

// Locale, timezone, calendar — often enough to guess your country and habits.
export function collectLocale(): Section {
  const dt = Intl.DateTimeFormat().resolvedOptions()
  const offsetMin = -new Date().getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const offset = `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`

  const fields: Field[] = [
    {
      key: 'Timezone',
      value: str(dt.timeZone),
      note: 'Pinpoints your region — no location permission required.',
      entropy: Entropy.High,
    },
    { key: 'UTC offset', value: offset, entropy: Entropy.Med },
    { key: 'Locale', value: str(dt.locale), entropy: Entropy.Med },
    { key: 'Language', value: str(navigator.language), entropy: Entropy.Med },
    {
      key: 'Languages',
      value: str(Array.from(navigator.languages ?? [])),
      note: 'Ordered preference list — a strong fingerprint component.',
      entropy: Entropy.High,
    },
    { key: 'Calendar', value: str(dt.calendar), entropy: Entropy.Low },
    { key: 'Numbering', value: str(dt.numberingSystem), entropy: Entropy.Low },
  ]

  return {
    id: 'locale',
    title: 'Locale & time',
    blurb: 'Language order and timezone together are enough to guess where you live.',
    fields,
  }
}

type PrefNav = Navigator & { globalPrivacyControl?: boolean; doNotTrack?: string | null }

// The visitor's OS-level preferences, leaked through media queries.
export function collectPreferences(): Section {
  const mq = (q: string) => (window.matchMedia?.(q).matches ? 'Yes' : 'No')
  const n = navigator as PrefNav
  const dntRaw = n.doNotTrack ?? (window as unknown as { doNotTrack?: string }).doNotTrack

  const fields: Field[] = [
    { key: 'Color scheme', value: mq('(prefers-color-scheme: dark)') === 'Yes' ? 'Dark' : 'Light', entropy: Entropy.Low },
    { key: 'Reduced motion', value: mq('(prefers-reduced-motion: reduce)'), entropy: Entropy.Low },
    { key: 'Reduced data', value: mq('(prefers-reduced-data: reduce)'), entropy: Entropy.Low },
    { key: 'Contrast', value: mq('(prefers-contrast: more)') === 'Yes' ? 'More' : 'Standard', entropy: Entropy.Low },
    { key: 'Forced colors', value: mq('(forced-colors: active)'), entropy: Entropy.Low },
    {
      key: 'Do Not Track',
      value: dntRaw === '1' ? 'On' : dntRaw === '0' ? 'Off' : 'Unset',
      note: 'A request sites are free to ignore — most do.',
      entropy: Entropy.Low,
    },
    {
      key: 'Global Privacy Control',
      value: str(n.globalPrivacyControl),
      note: 'A legally-recognized opt-out signal in some regions.',
      status: n.globalPrivacyControl ? FieldStatus.Ok : undefined,
      entropy: Entropy.Low,
    },
  ]

  return {
    id: 'preferences',
    title: 'Preferences & accessibility',
    blurb: 'Your accessibility and privacy settings are visible to any page.',
    fields,
  }
}
