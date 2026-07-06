import { useEffect, useState } from 'react'

type Props = {
  ip: string
}

const CHAR_MS = 65

// Types the visitor's IP out after mount, then leaves a glowing underline.
// SSR and first client render show the full value (no hydration mismatch);
// the effect re-types it. Reduced-motion users just see the static value.
export default function GreetIp({ ip }: Props) {
  const [shown, setShown] = useState(ip)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    setShown('')
    setTyping(true)
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setShown(ip.slice(0, i))
      if (i >= ip.length) {
        window.clearInterval(id)
        setTyping(false)
      }
    }, CHAR_MS)
    return () => window.clearInterval(id)
  }, [ip])

  return (
    <span className="ip-glow font-semibold text-[var(--stamp)]" data-typing={typing}>
      {shown}
      {typing ? <span className="ip-caret" aria-hidden /> : null}
    </span>
  )
}
