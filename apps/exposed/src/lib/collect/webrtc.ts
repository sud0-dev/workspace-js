// WebRTC local-IP leak. A page can open a peer connection with no permission
// prompt and read the ICE candidates the browser gathers — which include your
// machine's address on the local network (and historically the public IP too).

import { Entropy, FieldStatus, type Field, type Section } from './types'

const IP_RE = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})|([a-f0-9]{1,4}(?::[a-f0-9]{1,4}){7})/gi
const GATHER_TIMEOUT_MS = 1200

// Open a throwaway peer connection and harvest addresses from ICE candidates.
function gatherLocalIps(): Promise<string[]> {
  return new Promise((resolve) => {
    const found = new Set<string>()
    let pc: RTCPeerConnection
    try {
      pc = new RTCPeerConnection({ iceServers: [] })
    } catch {
      resolve([])
      return
    }

    const done = () => {
      try {
        pc.close()
      } catch {
        /* already closed */
      }
      resolve(Array.from(found))
    }

    const timer = setTimeout(done, GATHER_TIMEOUT_MS)

    pc.onicecandidate = (e) => {
      if (!e.candidate) {
        clearTimeout(timer)
        done()
        return
      }
      const matches = e.candidate.candidate.match(IP_RE)
      // Skip mDNS obfuscation placeholders (contain ".local").
      if (matches) for (const m of matches) if (!m.endsWith('.local')) found.add(m)
    }

    pc.createDataChannel('x')
    pc.createOffer()
      .then((o) => pc.setLocalDescription(o))
      .catch(() => {
        clearTimeout(timer)
        done()
      })
  })
}

export async function collectWebRtc(): Promise<Section> {
  const ips = await gatherLocalIps()
  const mdnsHidden = ips.length === 0

  const fields: Field[] = [
    {
      key: 'Local addresses',
      value: ips.length ? ips.join(', ') : null,
      note: mdnsHidden
        ? 'Your browser masks these behind mDNS — a good sign.'
        : 'Your address on the local network, leaked with no prompt.',
      entropy: Entropy.High,
      status: mdnsHidden ? FieldStatus.Ok : FieldStatus.Leak,
    },
    {
      key: 'mDNS protection',
      value: mdnsHidden ? 'Active' : 'Off',
      note: 'Modern browsers hide local IPs behind random *.local names.',
      status: mdnsHidden ? FieldStatus.Ok : FieldStatus.Warn,
      entropy: Entropy.Low,
    },
  ]

  return {
    id: 'webrtc',
    title: 'WebRTC leak',
    blurb: 'A real-time-communication feature quietly reveals your internal network address.',
    fields,
  }
}
