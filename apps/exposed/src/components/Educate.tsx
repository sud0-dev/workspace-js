// SEO-oriented explainer + FAQ. Rendered on the server so search engines and
// visitors both get the substance, not just the interactive readout.

type Faq = { q: string; a: string }

const DEFENSES: { title: string; body: string }[] = [
  {
    title: 'Use a tracker-blocking browser',
    body: 'Firefox with strict protection, Brave, or the Tor Browser neutralize most fingerprinting and block third-party trackers by default.',
  },
  {
    title: 'Disable WebRTC IP exposure',
    body: 'If you do not use in-browser calls, turn off WebRTC or scope it to your VPN so it cannot leak your local and real IP.',
  },
  {
    title: 'Route through a VPN or Tor',
    body: 'A VPN hides your real IP and coarse location from every site. Tor goes further, at a cost to speed.',
  },
  {
    title: 'Deny by default',
    body: 'Location, camera, microphone, and notifications should stay off until a site genuinely needs them — and be revoked after.',
  },
]

const FAQS: Faq[] = [
  {
    q: 'What information can a website see about me?',
    a: 'Without any permission, a site sees your IP address and the coarse location it maps to, your device type, operating system, browser, screen resolution, timezone, language, GPU, and a canvas/audio fingerprint that identifies your exact machine. Grant a permission and it can also read precise GPS, clipboard, camera, and microphone.',
  },
  {
    q: 'Is this page tracking me?',
    a: 'No. Everything shown here is computed in your own browser and never leaves your device. The network details come from the edge server that delivered the page — the same details every site receives — and are not stored.',
  },
  {
    q: 'What is a browser fingerprint?',
    a: 'A fingerprint is the combination of dozens of small, individually-harmless details — fonts, GPU, screen size, timezone — that together are unique enough to recognize you across sites, even without cookies and even in private browsing.',
  },
  {
    q: 'How do I stop being fingerprinted?',
    a: 'Use a browser that resists fingerprinting (Tor Browser, or Firefox with resistFingerprinting), block third-party scripts, keep your browser updated, and avoid rare configurations that make you stand out.',
  },
]

export default function Educate() {
  return (
    <>
      <section id="protect" className="scroll-mt-20">
        <p className="kicker">Countermeasures</p>
        <h2 className="display mt-2 text-[clamp(1.5rem,4vw,2.2rem)] leading-tight text-[var(--ink)]">
          How to give away less
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {DEFENSES.map((d) => (
            <div key={d.title} className="rounded-md border border-[var(--rule)] bg-[var(--card)] p-4">
              <h3 className="display text-[0.98rem] text-[var(--ink)]">{d.title}</h3>
              <p className="mt-1.5 text-[0.85rem] leading-snug text-[var(--ink-soft)]">{d.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[0.85rem] leading-relaxed text-[var(--ink-soft)]">
          For a vetted, regularly-updated set of privacy tools and guides, see{' '}
          <a
            href="https://www.privacyguides.org/en/"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--stamp)]"
          >
            Privacy Guides
          </a>{' '}
          — an independent, non-profit resource covering browsers, VPNs, and
          fingerprinting defenses in depth.
        </p>
      </section>

      <section className="mt-14">
        <p className="kicker">Common questions</p>
        <h2 className="display mt-2 text-[clamp(1.5rem,4vw,2.2rem)] leading-tight text-[var(--ink)]">
          What websites can see about you
        </h2>
        <div className="mt-6 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-3">
              <summary className="display cursor-pointer list-none text-[1rem] text-[var(--ink)] marker:content-none">
                <span className="text-[var(--stamp)]">▸ </span>
                {f.q}
              </summary>
              <p className="mt-2 max-w-[70ch] text-[0.88rem] leading-relaxed text-[var(--ink-soft)]">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
