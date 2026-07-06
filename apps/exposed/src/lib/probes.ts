// Permission-gated probes — these DO trigger a browser prompt, so the visitor
// opts in by clicking. They demonstrate what a site gains the moment you say
// "Allow". Each returns { data, error }; never throws past the boundary.

export type ProbeResult = { data: string | null; error: string | null }

// Precise GPS — accurate to a few meters, versus IP-level city guessing.
export async function probeGeolocation(): Promise<ProbeResult> {
  if (!navigator.geolocation) return { data: null, error: 'Geolocation unsupported' }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        resolve({
          data: `${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)} m)`,
          error: null,
        })
      },
      (err) => resolve({ data: null, error: err.message || 'Permission denied' }),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  })
}

// Clipboard read — a page can lift whatever you last copied, if you allow it.
export async function probeClipboard(): Promise<ProbeResult> {
  try {
    if (!navigator.clipboard?.readText) return { data: null, error: 'Clipboard API unsupported' }
    const text = await navigator.clipboard.readText()
    const preview = text.length > 120 ? `${text.slice(0, 120)}…` : text
    return { data: preview || '(clipboard was empty)', error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Permission denied' }
  }
}

// Device motion — accelerometer/gyroscope, requestable on iOS via a prompt.
export async function probeMotion(): Promise<ProbeResult> {
  const D = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent
  if (!D) return { data: null, error: 'Motion sensors unsupported' }
  try {
    if (typeof D.requestPermission === 'function') {
      const state = await D.requestPermission()
      if (state !== 'granted') return { data: null, error: 'Permission denied' }
    }
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve({ data: null, error: 'No motion data received' }), 3000)
      window.addEventListener(
        'devicemotion',
        (e) => {
          clearTimeout(timer)
          const g = e.accelerationIncludingGravity
          resolve({ data: g ? `x ${g.x?.toFixed(2)} · y ${g.y?.toFixed(2)} · z ${g.z?.toFixed(2)}` : 'available', error: null })
        },
        { once: true },
      )
    })
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'unavailable' }
  }
}
