// Registers the Service Worker in production only. Dev sees no SW.
export function registerSW() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  if (!import.meta.env.PROD) return
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // silent: SW is a progressive enhancement
    })
  })
}
