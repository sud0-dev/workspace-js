import { Link, createFileRoute } from '@tanstack/react-router'
import { getNetwork } from '#/server/network'
import Educate from '#/components/Educate'

const LOOPBACK = new Set(['127.0.0.1', '::1', 'localhost'])

export const Route = createFileRoute('/protect')({
  // Pull just the visitor's public IP from the edge to greet them by it.
  loader: async (): Promise<{ ip: string | null }> => {
    const { data } = await getNetwork()
    const ip = data?.fields.find((f) => f.key === 'IP address')?.value ?? null
    return { ip }
  },
  head: () => ({
    meta: [
      { title: 'Protect yourself — exposed.sud0.dev' },
      {
        name: 'description',
        content:
          'Practical steps to reveal less to the websites you visit: tracker-blocking browsers, VPN/Tor, disabling WebRTC leaks, and denying permissions by default.',
      },
    ],
  }),
  component: Protect,
})

function Protect() {
  const { ip } = Route.useLoaderData()
  const isLoopback = ip !== null && LOOPBACK.has(ip)

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6 sm:py-16">
      <p className="kicker">
        <Link to="/" className="text-[var(--stamp)] no-underline">
          ← back to your file
        </Link>
      </p>

      {/* Greet the visitor by the exact public IP every site they touch logs. */}
      <div className="mt-5 rounded-md border border-[var(--rule)] bg-[var(--card)] p-5 sm:p-6">
        <p className="display text-[clamp(1.4rem,4vw,2rem)] leading-tight text-[var(--ink)]">
          hello,{' '}
          <span className="text-[var(--stamp)]">
            {ip ?? 'unknown address'}
          </span>
        </p>
        <p className="mt-2 max-w-[62ch] text-[0.88rem] leading-relaxed text-[var(--ink-soft)]">
          {isLoopback
            ? 'That is a loopback address — you are viewing this on a local dev server, so the edge sees localhost. In production this shows the real public IP every website you visit records.'
            : 'This is the public IP address every website you visit sees and logs — no permission required. Cross-check it against any "what is my IP" tool; it will match.'}
        </p>
      </div>

      <div className="divider" />

      <Educate />

      <footer className="mt-16 border-t border-[var(--rule)] pt-8 text-[0.8rem] text-[var(--ink-faint)]">
        <p className="mono text-[0.72rem]">
          No analytics · No cookies · No data leaves this device.
        </p>
      </footer>
    </main>
  )
}
