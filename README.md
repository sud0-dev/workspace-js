# workspace-js

A Bun-workspace monorepo for the JavaScript/TypeScript side of [sud0.dev](https://sud0.dev). Each app under `apps/` is a small, deployable side project. Pair-programmed with Claude.

Maintained by [Naman](https://insanenaman.com).

## Apps

| App | URL | What |
|---|---|---|
| [`apps/portfolio`](./apps/portfolio) | [sud0.dev](https://sud0.dev) | **sud0.dev** — the portfolio / projects index. Terminal aesthetic. |
| [`apps/rust-repl`](./apps/rust-repl) | [foundry-rs.sud0.dev](https://foundry-rs.sud0.dev) | **Foundry** — a Rust REPL in your browser. TanStack Start + CodeMirror 6 + IndexedDB cache, compiles via play.rust-lang.org through a Cloudflare Worker. |
| [`apps/crates`](./apps/crates) | [crates.sud0.dev](https://crates.sud0.dev) | **crates.sud0.dev** — a faster UI for crates.io. Drop-in URL swap. *(building)* |

More to come.

## Stack

- **Package manager / runtime**: [Bun](https://bun.sh)
- **Workspaces**: native Bun workspaces (`apps/*`, `packages/*`)
- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19, SSR + streaming server functions)
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS 4 (CSS-first `@theme`)
- **Tests**: Vitest + Testing Library + Playwright
- **Deploy**: Cloudflare Workers (static assets + SSR via `wrangler`)

## Setup

```sh
bun install                          # installs every workspace
cd apps/rust-repl
bun --bun run dev                    # http://localhost:3000
```

## Per-app scripts

Each app exposes the same surface:

| Script | What |
|---|---|
| `bun --bun run dev` | dev server |
| `bun --bun run test` | vitest |
| `bun --bun run test:e2e` | playwright (run `bunx playwright install chromium` once first) |
| `bun --bun run build` | production build |
| `bun --bun run deploy` | `wrangler deploy` (needs `wrangler login`) |

## Conventions

See [`CLAUDE.md`](./CLAUDE.md) for code-style and architecture rules that apply across the workspace.
