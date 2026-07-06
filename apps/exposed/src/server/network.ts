import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { Entropy, FieldStatus, type Field, type Section } from '#/lib/collect/types'

// Cloudflare attaches an edge-geo object to the incoming Request. It is not in
// the Fetch types, so we describe just the slice we read.
type CfProperties = {
  country?: string
  city?: string
  region?: string
  regionCode?: string
  continent?: string
  postalCode?: string
  latitude?: string
  longitude?: string
  timezone?: string
  asn?: number
  asOrganization?: string
  colo?: string
  httpProtocol?: string
  tlsVersion?: string
  tlsCipher?: string
  clientTcpRtt?: number
}

const NETWORK_SECTION_ID = 'network'

// Reads what the edge already knows before a single byte of your page runs.
export const getNetwork = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ data: Section | null; error: string | null }> => {
    try {
      const request = getRequest()
      if (!request) return { data: null, error: 'no request context' }

      const headers = request.headers
      const cf = (request as unknown as { cf?: CfProperties }).cf ?? {}

      // IP: Cloudflare's connecting-IP header is authoritative at the edge.
      const ip =
        headers.get('cf-connecting-ip') ??
        headers.get('x-real-ip') ??
        headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        null

      const country = cf.country ?? headers.get('cf-ipcountry') ?? null
      const cityBits = [cf.city, cf.region, country].filter(Boolean)
      const coarseGeo =
        cf.latitude && cf.longitude
          ? `${Number(cf.latitude).toFixed(1)}, ${Number(cf.longitude).toFixed(1)}`
          : null

      const fields: Field[] = [
        {
          key: 'IP address',
          value: ip,
          note: 'The public address every server you touch logs. Handed over automatically.',
          entropy: Entropy.High,
          status: FieldStatus.Leak,
          sensitive: true,
        },
        {
          key: 'Approx. location',
          value: cityBits.length ? cityBits.join(' · ') : null,
          note: 'Derived from your IP at the edge — no GPS permission needed.',
          entropy: Entropy.Med,
          sensitive: true,
        },
        {
          key: 'Coarse coordinates',
          value: coarseGeo,
          note: 'IP-level lat/long, rounded. Precise enough to place your city.',
          entropy: Entropy.Med,
          sensitive: true,
        },
        {
          key: 'Postal / region',
          value: [cf.postalCode, cf.regionCode].filter(Boolean).join(' · ') || null,
          entropy: Entropy.Med,
        },
        {
          key: 'Network (ASN)',
          value: cf.asn ? `AS${cf.asn}${cf.asOrganization ? ` · ${cf.asOrganization}` : ''}` : null,
          note: 'Your ISP or carrier, identified from the IP.',
          entropy: Entropy.Med,
        },
        {
          key: 'Edge datacenter',
          value: cf.colo ?? null,
          note: 'The Cloudflare location that served you — a proxy for where you are.',
          entropy: Entropy.Low,
        },
        {
          key: 'HTTP protocol',
          value: cf.httpProtocol ?? headers.get('x-forwarded-proto') ?? null,
          entropy: Entropy.Low,
        },
        {
          key: 'TLS version',
          value: [cf.tlsVersion, cf.tlsCipher].filter(Boolean).join(' · ') || null,
          entropy: Entropy.Low,
        },
        {
          key: 'Round-trip time',
          value: typeof cf.clientTcpRtt === 'number' ? `${cf.clientTcpRtt} ms` : null,
          note: 'Network latency measured at the TCP handshake.',
          entropy: Entropy.Low,
        },
        {
          key: 'User-Agent (raw)',
          value: headers.get('user-agent'),
          note: 'The full identity string your browser sends with every request.',
          entropy: Entropy.High,
        },
        {
          key: 'Accept-Language',
          value: headers.get('accept-language'),
          note: 'Your language preferences, ranked — a strong fingerprint signal.',
          entropy: Entropy.Med,
        },
      ]

      return {
        data: {
          id: NETWORK_SECTION_ID,
          title: 'Network & origin',
          blurb:
            'This arrived before your browser ran any of our code. Every request you make leaks it.',
          fields,
        },
        error: null,
      }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'unknown' }
    }
  },
)
