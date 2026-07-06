// Fingerprint collectors — canvas, WebGL, and audio each render an invisible
// probe and hash the result. Tiny rendering differences between GPUs, drivers,
// and OSes make these highly identifying, which is exactly the point.

import { Entropy, FieldStatus, type Field, type Section } from './types'
import { fnv1a, str } from './format'

// Draw text + shapes to an offscreen canvas and hash the pixels.
function canvasHash(): string | null {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 240
    canvas.height = 60
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.textBaseline = 'top'
    ctx.font = "16px 'Arial'"
    ctx.fillStyle = '#f60'
    ctx.fillRect(2, 2, 120, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('exposed.sud0.dev \u{1F5B1}', 4, 4)
    ctx.fillStyle = 'rgba(80,180,120,0.7)'
    ctx.fillText('exposed.sud0.dev \u{1F5B1}', 6, 6)
    return fnv1a(canvas.toDataURL())
  } catch {
    return null
  }
}

// The unmasked GPU vendor + renderer string — one of the strongest signals.
function webglInfo(): { vendor: string | null; renderer: string | null; hash: string | null } {
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return { vendor: null, renderer: null, hash: null }

    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    const vendor = dbg ? String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)) : null
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : null

    const params = [
      gl.getParameter(gl.MAX_TEXTURE_SIZE),
      gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      gl.getSupportedExtensions()?.join(','),
    ].join('|')

    return { vendor, renderer, hash: fnv1a(`${vendor}~${renderer}~${params}`) }
  } catch {
    return { vendor: null, renderer: null, hash: null }
  }
}

// Render a short tone through an offline audio graph; hash the output curve.
async function audioHash(): Promise<string | null> {
  try {
    const Ctx =
      (window as unknown as { OfflineAudioContext?: typeof OfflineAudioContext }).OfflineAudioContext ??
      (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext
    if (!Ctx) return null

    const ctx = new Ctx(1, 5000, 44100)
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = 10000
    const comp = ctx.createDynamicsCompressor()
    osc.connect(comp)
    comp.connect(ctx.destination)
    osc.start(0)

    const buffer = await ctx.startRendering()
    const data = buffer.getChannelData(0).subarray(2000, 3000)
    let acc = 0
    for (let i = 0; i < data.length; i++) acc += Math.abs(data[i])
    return fnv1a(acc.toString())
  } catch {
    return null
  }
}

export async function collectFingerprint(): Promise<Section> {
  const gl = webglInfo()
  const [audio] = await Promise.all([audioHash()])

  const fields: Field[] = [
    {
      key: 'GPU vendor',
      value: str(gl.vendor),
      note: 'Read straight off your graphics driver.',
      entropy: Entropy.High,
      status: gl.vendor ? FieldStatus.Leak : undefined,
    },
    { key: 'GPU renderer', value: str(gl.renderer), entropy: Entropy.High, status: gl.renderer ? FieldStatus.Leak : undefined },
    {
      key: 'Canvas hash',
      value: canvasHash(),
      note: 'How your device draws one line of text — stable across visits.',
      entropy: Entropy.High,
      status: FieldStatus.Warn,
    },
    { key: 'WebGL hash', value: gl.hash, entropy: Entropy.High, status: FieldStatus.Warn },
    {
      key: 'Audio hash',
      value: audio,
      note: 'Your audio stack processes a silent tone in a measurably unique way.',
      entropy: Entropy.High,
      status: FieldStatus.Warn,
    },
  ]

  return {
    id: 'fingerprint',
    title: 'Fingerprint probes',
    blurb:
      'None of these ask permission. Together they identify your exact device across sites — even in incognito.',
    fields,
  }
}
