# Workspace rules

Stack: Bun workspaces · TanStack Start · Vite · TypeScript · Tailwind 4.

Current app: `apps/rust-repl` (Foundry — local-first Rust REPL).

---

## Communication style — time is precious

- **Be short.** Cut hedges, restatement, throat-clearing.
- **Use plain language.** Avoid jargon when a plain word fits.
- **Lead with the answer.** First line gives the takeaway. Detail follows only if needed.
- **One idea per line / bullet.** Short bullets > long paragraphs. Tables for comparisons.
- **No filler closers.** Skip "let me know if you have questions", "hope this helps".
- **Show, don't summarize, code.** Quote with `file:line` refs; don't re-explain what's visible.
- **Ask only when blocked.** One sharp question > three soft ones. Don't ask permission on reversible local edits when the intent is clear.

Depth is fine when the topic needs it — keep structure scannable (headings + bullets, not walls of prose).

```text
// Bad — restated question, hedged, filler closer
> You asked whether `getClaims()` is safe on the server. That's a great question!
> I think, generally speaking, it should be fine in most cases. Let me know
> if you have any other questions!

// Good — leads with the answer, no filler
Safe. `getClaims()` validates the JWT locally — no network call.
See `src/lib/foo.ts:42`.
```

---

## Security review — always, every change

Every diff, suggestion, or new code path gets a security pass before it ships. Built into the default review.

- **Flag exploit surface.** Auth bypass, IDOR, CSRF, XSS, injection (SQL/NoSQL/template/log/header), SSRF, open redirect, path traversal, deserialization, race/TOCTOU, secret leakage, log/transcript leakage, JWT/cookie scoping, replay windows, broken rate-limits, dependency supply-chain risk.
- **Think about the attacker, not just the bug.** "What if this URL/param/body/header is malicious?" Consider: invalid token, stale session, malicious link, log forwarding, shared device, leaked URL, replayable token.
- **Trust boundaries.** Name them explicitly: which side validates, which side authorizes, which secret stays server-side.
- **Surface findings even when not asked.** Prefix `⚠️ Security:`. Don't bury in a paragraph. State conditions when exploitability is conditional.
- **Never silently weaken a defense.** Removing a check, broadening a grant, relaxing CORS — call it out and justify.
- **Defaults: deny, narrow, server-side.** Fail-closed, least privilege.

```text
// Good — inline finding during review
⚠️ Security: `src/server/eval.ts` blindly compiles whatever `source` arrives.
If the compile path is ever proxied to a public endpoint, gate behind a per-IP
rate-limit and a max source-length cap — current code DoSes the compile worker
in seconds with a megabyte payload.
```

---

## Secrets & .env files

- **NEVER read, cat, grep, or open `.env` files.** Includes `.env`, `.env.local`, `.env.production`, `.env.*`.
- For env names, read `.env.example` / `.env.sample` / `.env.template` instead.
- If no example exists and names are needed: `grep -E '^[A-Z_][A-Z0-9_]*=' .env.example | cut -d= -f1` — names only, never values.
- Same rule for `credentials.json`, `service-account*.json`, `*.pem`, `*.key`, `~/.aws/credentials`.
- If the user insists on reading a real `.env`, refuse and remind them tool output lands in the transcript.
- If a secret may have leaked into the transcript, surface a prominent warning and tell the user to rotate immediately.

```bash
# Bad — exposes real secrets in the transcript
cat .env

# Good — read the example
cat .env.example

# Good — names only
grep -E '^[A-Z_][A-Z0-9_]*=' .env.example | cut -d= -f1
```

---

## Filesystem scoping — never search outside the workspace

- **Never run `find /`, `find /Users`, `find ~`, or any other root-anchored or home-anchored filesystem walk.** macOS TCC fires "process tried to access X" alerts when *any* process enumerates protected folders (Documents, Downloads, Desktop, Library, Proton Pass, browser profiles, `~/.ssh`, `~/.aws`, …). Even with `2>/dev/null` suppressing the visible error, the OS still notifies the user and the attempt looks like exfiltration.
- **Always anchor searches at the workspace root** (`find . …`) or at a specific known subtree (`find node_modules/<pkg> …`, `find apps/<app> …`).
- **If you need to inspect a package's source** and the installed `node_modules` copy doesn't expose it, use `WebFetch` against the package's GitHub README/source — don't trawl the filesystem for other installed copies.
- **Same rule for `grep`, `rg`, `ls -R`, `tree`.** Recursive listings respect the same scope.

```bash
# Bad — walks the entire home directory, trips TCC, alarms the user
find /Users -name "*.lock" -type f
grep -r "TODO" ~/

# Bad — silently scans protected folders because the error suppressor hides the alert
find /Users -path "*node_modules/react-router*" 2>/dev/null

# Good — scoped to the workspace
find . -name "*.lock" -type f
grep -r "TODO" apps/

# Good — scoped to a specific package when you actually need its internals
find node_modules/react-resizable-panels -name "*.d.ts"
```

## Dependencies & supply chain

- **Prefer zero new deps.** Supply-chain attacks (typosquatting, post-install scripts, hijacked maintainers) are active. Every new transitive package = attack surface in CI, dev, and bundle.
- **Before `bun add`, exhaust in-repo and platform options.** Can a vitest API replace a test dep? Is it 10–50 lines we can write inline? Is something already installed that covers it?
- **Never install without explicit user confirmation.** State *what*, *why*, *what it replaces*. Wait for "yes".
- **If a dep is rejected, don't retry.** Proceed without it; note any capability loss explicitly.

```text
// Good — surface a needed dep, then WAIT
Proposing: bun add @codemirror/lang-rust
Why: Rust syntax highlighting in the cell editor
Replaces: hand-rolled regex highlighter (would be ~600 lines and miss lifetimes/macros)
Alternatives ruled out: lezer-rust directly (lang-rust already wraps it)
```

---

## TypeScript rules

### Use `type` over `interface` — always

- Never `interface`. Always `type`.
- `type` is more flexible: unions, intersections, mapped types.

```ts
// Bad
interface Cell { id: string; status: 'idle' | 'running' }

// Good
type Cell = { id: string; status: 'idle' | 'running' }
```

### Extract props into `type Props` — no inline prop types

- Never define props inline. Always `type Props` at the top of the file.
- Destructure in the signature: `function Cell({ id }: Props)`.
- For helper components in the same file, use a descriptive name like `type CellHeaderProps` to avoid collisions with `Props`.

```tsx
// Bad — inline, hard to scan
function Cell({ id, status }: { id: string; status: CellStatus }) { ... }

// Good — extracted, easy to read
type Props = {
  id: string
  status: CellStatus
}

function Cell({ id, status }: Props) { ... }
```

### Return `{ data, error }` from async functions and server actions

- All async helpers and server functions (TanStack Start `createServerFn`) return `{ data, error }`. Never throw, never return a `Response`.
- If `error` is non-null, `data` is null. And vice versa.
- **Streaming generators are exempt** — yielding a typed event union (as in `src/server/eval.ts`) is the right shape there. The discriminant `kind: 'error'` carries failure.

```ts
// Bad — throws, caller must wrap, types lie
export const compileToWasm = createServerFn().handler(async ({ data }) => {
  const res = await fetch(COMPILE_URL, { method: 'POST', body: data.source })
  if (!res.ok) throw new Error(`compile failed: ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
})

// Good — { data, error }, never throws past the boundary
export const compileToWasm = createServerFn()
  .validator((d: { source: string }) => d)
  .handler(async ({ data }): Promise<{ data: Uint8Array | null; error: string | null }> => {
    try {
      const res = await fetch(COMPILE_URL, { method: 'POST', body: data.source })
      if (!res.ok) return { data: null, error: `compile failed: ${res.status}` }
      return { data: new Uint8Array(await res.arrayBuffer()), error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'unknown' }
    }
  })
```

```ts
// Bad — throws, caller has to wrap in try/catch
async function fetchProfile(id: string) {
  const res = await fetch(`/api/profile/${id}`)
  if (!res.ok) throw new Error('fetch failed')
  return res.json()
}

// Good — { data, error } at boundaries
async function fetchProfile(id: string): Promise<{ data: Profile | null; error: string | null }> {
  try {
    const res = await fetch(`/api/profile/${id}`)
    if (!res.ok) return { data: null, error: `fetch failed: ${res.status}` }
    return { data: (await res.json()) as Profile, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'unknown' }
  }
}
```

### Explicit type casting

- Always explicitly cast for type conversions: `Number()`, `String()`, `as X` for assertions.
- Never rely on implicit coercion.

### Type aliases for complex types

- Don't repeat `Database["public"]["Enums"]["x"]`-style chains. Declare a top-of-file alias and reuse.

### No non-null assertions (`!`)

- Never use `!` to bypass null checks. Add explicit checks and early-return.

```ts
// Bad
const cell = cells.find((c) => c.id === id)!

// Good
const cell = cells.find((c) => c.id === id)
if (!cell) return { data: null, error: 'cell not found' }
```

### Avoid `as unknown as X` — last resort only

- Never double-cast to silence TS.
- Investigate the actual type first — it's usually wider than you think.
- If two unrelated types truly need to bridge, prefer a runtime conversion (`Number(v)`, `JSON.parse(...)`) or fix the schema/type.

### No hardcoded strings for known values — use enums or constants

- Never use raw string literals (`"active"`, `"stable"`, `"wasm32-unknown-unknown"`) for values from a known set.
- **If the constant doesn't exist yet, create it before using the value.** Declare an `enum` (preferred for fixed sets) or `as const` object, export it, use the member.
- For Zod, derive from the enum: `z.enum(Object.values(MODULES) as [MODULES, ...MODULES[]])`.
- Under `isolatedModules: true`, use regular `enum`, not `const enum`.

```ts
// Bad — literal scattered around
if (target === "wasm32-unknown-unknown") { ... }

// Good
enum CompileTarget {
  WasmUnknown = "wasm32-unknown-unknown",
  WasmWasi = "wasm32-wasip1",
}

if (target === CompileTarget.WasmUnknown) { ... }
```

### Constants and enums — UPPER_SNAKE_CASE

- Module-level constants and enum values: `UPPER_SNAKE_CASE`.
- Local variables inside functions: `camelCase`.

```ts
// Bad
const maxRetries = 3

// Good
const MAX_RETRIES = 3
```

---

## Code style & structure

### File ordering — types/schemas at the top

- Order: imports → types → schemas/constants → functions.
- **More than 2 types in a file → extract to `index.types.ts`** (or `types.ts` for standalone modules) and import.
- **Schemas (Zod etc.) live in a dedicated file** (`index.schema.ts` / `schema.ts`) — never inline in action or component files.

### One-liner comments for readability

- Brief one-line comments above key sections explaining *what* and *why*.
- Add for: major logical steps, important calculations, conditional branches, error paths, business logic decisions.
- Skip obvious comments that just restate the code.

### Functions under 100 lines, files under 250 lines

- > 100 lines in a function → refactor into smaller named functions.
- > 250 lines in a file → split. Extract types/helpers/validation into their own files. Use a folder when 3+ related files exist.

### File naming

- Sibling to `index.ts`: `index.helpers.ts`, `index.types.ts`, `index.utils.ts`, `index.schema.ts`.
- Standalone modules: `schema.ts`, `types.ts`, `helpers.ts`.
- Bigger modules: dedicated folders (`helpers/`, `types/`) with `index.ts` re-exports.
- Be consistent within each module — pick one approach.

### Tests live in a dedicated `tests/` folder

- All test files in a `tests/` folder at the module or project level — **not co-located** with source.
- Mirror the source structure inside `tests/`.

```
// Bad — co-located
src/state/
  notebook.ts
  notebook.test.ts

// Good — gathered
src/state/
  notebook.ts
  tests/
    notebook.test.ts
```

---

## Performance & code quality

### Deduce pattern — pure functions for derived values

- For derived/computed values: pure function outside the component, pass inputs, get the result. Call it directly in render — no hooks, no extra render cycle.
- **Never `useEffect` + `useState` to compute a value from existing props/state.** Causes a wasted render with stale data. Compute inline or via a helper.
- **`useMemo` only when genuinely expensive** (large sort/filter, complex aggregations). React 19 Compiler makes most manual memoization redundant.
- **`useCallback` only when passing to `memo()` children or as a dep for hooks that interact with external systems.**
- **Don't move functions outside the component if they need closure over state** (e.g. `setState`). That's for stateless transformations only.
- Spot poor patterns (unnecessary re-renders, effects for derived state, inline object/function in hot paths) → warn the user.

### Readability over clever abstraction

- Readable, maintainable code > over-engineered abstractions. Simple > clever.
- No unnecessary indirection. Three similar lines > premature abstraction.

---

## Confidence & asking questions

- **Confidence < 8/10 on any implementation decision → stop and ask** before proceeding.
- Unsure about requirements, edge cases, or the right approach? Ask.
- One question beats redone work.

---

## Writing rules for this file

- Every rule **must include at least one concrete code example** (before/after or correct usage).
- Rules without examples are ambiguous.

---

## Stack-specific notes

### TanStack Start + Vite

- SSR is on by default. Components that touch `window`/`document` must mount inside `<ClientOnly>` from `@tanstack/react-router`.
- Server functions: `createServerFn` from `@tanstack/react-start`. For streaming, use `async function*` handlers — client iterates with `for await`.
- Path alias: `#/*` → `./src/*` (configured in app `package.json` imports).

### Tailwind 4

- CSS-first config in `src/styles.css` via `@theme { ... }`. No `tailwind.config.{js,ts}`.
- Use CSS variables (`var(--ink)`, `var(--ember)`) over Tailwind color tokens for anything theme-aware so light/dark just works.

### Testing

- Unit/component: Vitest 4 + jsdom + `@testing-library/react` + `@testing-library/jest-dom`. Setup at `src/test/setup.ts`. Tests in `tests/` folders. Run: `bun --bun run test`.
- E2E: Playwright. Tests in `apps/rust-repl/e2e/`. Run: `bun --bun run test:e2e`. **First-time browser install: `bunx playwright install chromium`** (not auto, ~150 MB).

### Deployment

- Target: Cloudflare Workers (with static assets). `apps/rust-repl/wrangler.toml` + `@cloudflare/vite-plugin` in `vite.config.ts`.
- Build only: `bun --bun run build`.
- Build + deploy: `bun --bun run deploy` (runs `wrangler deploy`).
- Compile-endpoint override: set `FOUNDRY_COMPILE_URL` in `wrangler.toml [vars]` (or `wrangler secret put` for sensitive endpoints). Defaults to `https://play.rust-lang.org/execute`.

### Self-hosting the compile backend

- Drop-in upstream: `rust-lang/rust-playground` (Docker, exposes the same `/execute` JSON contract). Run on any VPS, point `FOUNDRY_COMPILE_URL` at it.
- Alternatives if you want serverless: Vercel Sandbox, Cloudflare Containers (beta).
- ⚠️ Security: any non-loopback endpoint receives user-typed source code. If self-hosting publicly, gate behind auth (header token via `wrangler secret` → forwarded by `callPlayground`), rate-limit, and cap per-IP concurrency.
