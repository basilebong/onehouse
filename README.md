# Onehouse

A self-hosted "fleet of family apps" platform. Single Bun process, single Docker
image, mobile-first PWA, behind Caddy on a Hetzner VPS. First app: grocery
list. Not publicly branded — internal infrastructure only.

License: [Elastic License 2.0](./LICENSE) — free for self-hosted personal /
internal use; cannot be offered as a managed third-party service.

See the full architecture spec for context and rationale.

---

## Stack

- **Runtime:** Bun (latest stable)
- **HTTP:** Hono v4 — serves API + MCP + static React in one process
- **Frontend:** React 19 + Vite + TanStack (Router, Query, Form) + Tailwind v4
- **UI:** shadcn/ui (copy-paste, in `apps/web/src/components/ui/`) + Vaul
  (drawers) + Sonner (toasts) + Phosphor Icons
- **DB:** `bun:sqlite` via Drizzle ORM (beta)
- **Auth:** Better Auth — passkeys, Google One Tap, API keys (for MCP)
- **Validation:** Valibot at HTTP boundaries, Zod inside MCP tool defs only
- **Tests:** `bun:test`; Playwright for end-to-end
- **Package manager:** pnpm 11 (hardened defaults — see `.npmrc` and
  `pnpm-workspace.yaml`)

## Layout

```
onehouse/
├── apps/
│   ├── server/                # Single runtime entry. Composition only.
│   └── web/                   # React + Vite + PWA
├── packages/
│   ├── core/                  # Platform: auth, db, MCP plumbing, IDs, Result
│   └── app-grocery/           # First app — shared / server / tools / ui
├── drizzle/                   # Generated migrations (committed)
├── data/                      # SQLite + WAL (Docker volume)
├── scripts/                   # migrate.ts, backup, etc.
├── .claude/                   # Agent rules (root + per-topic)
└── .github/workflows/         # CI + deploy
```

Each `packages/app-*` exports four subpaths:

| Path        | What                                          | Browser? |
|-------------|-----------------------------------------------|----------|
| `./shared`  | state machines, types, Valibot schemas        | yes      |
| `./server`  | Drizzle schema, Hono routes, services         | no       |
| `./tools`   | MCP tool definitions                          | no       |
| `./ui`      | React components reusable across entry points | yes      |

The frontend imports `/shared` and `/ui` only. Importing `/server` or `/tools`
from browser code fails to type-check.

## Prerequisites

- [Bun](https://bun.sh) (latest stable)
- [pnpm](https://pnpm.io) 11+ (`npm install -g pnpm@latest`)
- Docker + Docker Compose (for the dev container or prod build)

## Getting started

```bash
# 1. Install (uses pnpm; Bun runs the code)
pnpm install

# 2. Configure
cp .env.example .env
# edit .env — at minimum BETTER_AUTH_SECRET (openssl rand -hex 32)

# 3. Generate auth + DB schema, run migrations
pnpm auth:generate
pnpm db:generate
pnpm db:migrate

# 4. Dev (host) — server (3000) + Vite (5173) with hot reload
pnpm dev

# OR Dev (Docker) — bind-mounted hot reload
docker compose --profile dev up
```

Open <http://localhost:5173>.

## Common commands

| Command                    | What                                            |
|----------------------------|-------------------------------------------------|
| `pnpm dev`                 | Server + Vite, hot reload                       |
| `pnpm test`                | `bun test`                                      |
| `pnpm typecheck`           | `tsc -b --noEmit` across the workspace          |
| `pnpm check`               | Biome lint + format check                       |
| `pnpm auth:generate`       | Regenerate Better Auth Drizzle schema; commit   |
| `pnpm db:generate`         | Generate Drizzle migration from schema diff     |
| `pnpm db:migrate`          | Apply pending migrations                        |
| `pnpm license:check`       | Verify all deps are permissive (MIT/Apache/BSD) |
| `bunx shadcn@latest add X` | Add a shadcn component (run in `apps/web`)      |

## Building & running production

```bash
docker build --target runtime -t onehouse .
docker run -v ./data:/data --env-file .env -p 3000:3000 onehouse
```

Or via compose (default profile is `prod`):

```bash
docker compose up -d
```

The production image runs one Bun process serving `/api/auth/*`, `/api/*`,
`/mcp`, and the static React bundle.

## Mobile-first

Every UI component is designed for a 360×780 viewport first and adapts up via
Tailwind breakpoints. Drawer (Vaul) is the default modal pattern; centered
Dialog is desktop-only. Full checklist in `.claude/rules/mobile.md`.

## Agent rules

Working with Claude Code? Read `.claude/CLAUDE.md` first. Per-topic rules live
in `.claude/rules/`. `AGENTS.md` is a symlink to the root rules for cross-tool
compatibility.

## Adding a new app

1. `mkdir packages/app-<name>`, copy the `app-grocery` skeleton
2. Add tables in `src/server/schema.ts`, then `pnpm db:generate`
3. State machine in `src/shared/state.ts`; Valibot schemas in
   `src/shared/validation.ts`
4. Add the four `exports` subpaths to `package.json`
5. Three one-liners:
   - `apps/server/src/composition.ts` → `.route("/api/<name>", routes)`
   - `apps/server/src/mcp.ts` → `register<Name>Tools(server, ctx)`
   - `apps/web/src/router.tsx` → register `/<name>` routes
6. Rebuild image, deploy

No core changes required.
