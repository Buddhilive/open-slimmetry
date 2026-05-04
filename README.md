# Open Slimmetry

Self-hosted observability for Next.js beta apps. Collects structured log events from your application, stores them in SQLite, and surfaces them in a searchable dashboard — no cloud account, no data leaving your infrastructure.

```
your Next.js app  ──POST /api/ingest──▶  Slimmetry server  ──▶  SQLite  ──▶  Dashboard
(slimmetry-next)                         (this repo)
```

---

## Contents

- [Architecture](#architecture)
- [Server — quick start](#server--quick-start)
- [Server — Docker](#server--docker)
- [Server — configuration](#server--configuration)
- [Ingest API](#ingest-api)
- [Dashboard](#dashboard)
- [Client library — `slimmetry-next`](#client-library--slimmetry-next)
- [Monorepo structure](#monorepo-structure)

---

## Architecture

| Part | What it is |
|---|---|
| **Slimmetry server** | Next.js 16 app — serves the dashboard and the `/api/ingest` POST endpoint. Stores events in a local SQLite file via `better-sqlite3`. |
| **`slimmetry-next`** | Zero-dependency TypeScript client library. Wraps `fetch` — drop it into any Next.js (or Node 18+) app and call `logger.send()`. |

The server runs as a single process. SQLite runs in WAL mode and is accessed through a singleton connection. An hourly cron job prunes rows older than `RETENTION_DAYS`.

---

## Server — quick start

**Prerequisites:** Node 20+, pnpm

```bash
git clone <this-repo>
cd open-slimmetry

# Install dependencies (better-sqlite3 compiles a native binary — takes ~30s on first run)
pnpm install

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the dashboard. The SQLite database is created automatically at `./data/slimmetry.db` on first request.

Send a test event:

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"log": "hello from curl", "logType": "info", "service": "my-app"}'
# → {"success":true,"id":1}
```

---

## Server — Docker

The repo ships a production-ready multi-stage Dockerfile at the project root.

**Build and run:**

```bash
docker build -t open-slimmetry:latest .

docker run -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  open-slimmetry:latest
```

> **Git Bash on Windows:** the shell rewrites POSIX paths in `-e` / `--env` flags. Use `MSYS_NO_PATHCONV=1 docker run ...` or run via docker compose instead.

**Compose (recommended for persistent deployments):**

```bash
docker compose -f docker/docker-compose.yml up
```

The compose file mounts `./data` as a named volume so the database survives container restarts.

**Image details:**
- Base: `node:20-alpine` (build) → `node:20-alpine` (runtime)
- Size: ~247 MB
- Runs as non-root user `nextjs` (uid 1001)
- `better-sqlite3` native module is compiled during the build stage

---

## Server — configuration

Copy `.env.example` to `.env.local` and adjust as needed. All variables are optional — the server runs with sensible defaults.

| Variable | Default | Description |
|---|---|---|
| `DB_PATH` | `./data/slimmetry.db` | Path to the SQLite database file. The directory is created automatically. |
| `RETENTION_DAYS` | `7` | Rows older than this are deleted by the hourly retention job. |
| `MAX_DB_MB` | `500` | Logs a warning when the database file exceeds this size. |
| `DASHBOARD_USERNAME` | _(empty)_ | Reserved for future basic-auth support — not enforced in v1. |
| `DASHBOARD_PASSWORD` | _(empty)_ | Reserved for future basic-auth support — not enforced in v1. |

---

## Ingest API

### `POST /api/ingest`

Accepts a JSON body and writes one log row to SQLite.

**Request body:**

```ts
{
  log: string         // required — the log message
  logType?: string    // optional — "error" | "warn" | "info" | "debug" | any string
  traceId?: string    // optional — correlation ID to group related events
  service?: string    // optional — name of the sending application
  environment?: string // optional — e.g. "beta", "staging"
}
```

**Responses:**

| Status | Body |
|---|---|
| `200` | `{ "success": true, "id": 42 }` |
| `400` | `{ "success": false, "error": "..." }` — `log` missing or not a string |
| `500` | `{ "success": false, "error": "Internal server error" }` |

**CORS:** all origins are allowed. The endpoint handles `OPTIONS` preflight requests.

```bash
# Basic log
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"log": "User signed up", "logType": "info", "service": "auth"}'

# With trace ID to correlate events
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"log": "Payment failed", "logType": "error", "traceId": "req-abc-123", "service": "checkout"}'
```

---

## Dashboard

Navigate to `http://localhost:3000/dashboard`.

**Features:**

- **Stats bar** — total log count with per-type badge pills, dynamically populated from the database.
- **Search** — full-text search across the `log` field using SQLite FTS5.
- **Filters** — filter by log type, service, environment, and date/time range. All filters update the URL so results are shareable.
- **Log table** — 50 rows per page. Columns: timestamp, type badge, service, log message, trace ID chip.
- **Log detail panel** — click any row to open a slide-in panel showing all fields in full.
- **Trace view** — click a trace ID chip to filter the table to all events sharing that ID, in chronological order.
- **Auto-refresh** — checkbox in the header re-fetches every 10 seconds without a full page reload.

**Log type colors:**

| Type | Color |
|---|---|
| `error` | Red |
| `warn` | Amber |
| `info` | Blue |
| `debug` | Gray |
| anything else | Purple |

---

## Client library — `slimmetry-next`

A lightweight TypeScript logger that POSTs events to your Slimmetry server. Zero runtime dependencies. Uses native `fetch` (available in Next.js 13+ and Node 18+). Never throws — network failures are silently swallowed.

### Installation

The package lives in this monorepo at `packages/slimmetry-client`. To use it in an external app, either publish it to npm or install directly from the path:

```bash
# From npm (once published)
pnpm add slimmetry-next

# Or from the local monorepo during development
pnpm add ../path/to/open-slimmetry/packages/slimmetry-client
```

### Setup

Create a shared logger instance once and export it:

```ts
// lib/logger.ts
import { createSlimmetry } from 'slimmetry-next'

export const logger = createSlimmetry({
  baseUrl: process.env.NEXT_PUBLIC_SLIMMETRY_URL!, // e.g. "http://localhost:3000"
  service: 'my-beta-app',
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? 'beta',
})
```

Set the env var in your app's `.env.local`:

```bash
NEXT_PUBLIC_SLIMMETRY_URL=http://localhost:3000
```

### Usage

```ts
import { logger } from '@/lib/logger'

// Fire and forget (most common)
logger.send({ log: 'User signed up' })

// With a log type
logger.send({ logType: 'info', log: 'Onboarding step 2 completed' })

// With a trace ID — correlate client and server events for the same request
logger.send({ traceId: requestId, logType: 'error', log: 'Payment failed: card declined' })

// Awaited when ordering matters
await logger.send({ traceId: jobId, logType: 'debug', log: 'Background job started' })
```

### Trace correlation pattern

Use a single `traceId` across all events for a given user action — then click any trace chip in the dashboard to see the full chain.

```ts
// In an API route or server action
const traceId = crypto.randomUUID()

await logger.send({ traceId, logType: 'info', log: 'Checkout initiated' })

try {
  await processPayment(cart)
  await logger.send({ traceId, logType: 'info', log: 'Payment succeeded' })
} catch (err) {
  await logger.send({ traceId, logType: 'error', log: `Payment failed: ${err.message}` })
}
```

### API reference

#### `createSlimmetry(config)`

| Option | Type | Required | Description |
|---|---|---|---|
| `baseUrl` | `string` | yes | URL of the Slimmetry server |
| `service` | `string` | no | App name attached to every event |
| `environment` | `string` | no | e.g. `"beta"`, `"staging"` |
| `silent` | `boolean` | no | Suppress console warnings (default: `false`) |

Returns a `SlimmetryLogger`:

#### `logger.send(payload)`

| Field | Type | Required | Description |
|---|---|---|---|
| `log` | `string` | yes | The log message |
| `logType` | `string` | no | Event severity or category |
| `traceId` | `string` | no | Correlation ID |

Returns `Promise<void>`. Guarantees:
- Never throws or rejects.
- All fields must be strings. Passing a non-string value emits a `console.warn` and skips the send.
- Non-2xx responses and network errors emit a `console.warn` (unless `silent: true`) and are otherwise ignored.

### Building the library

```bash
# Build (outputs to packages/slimmetry-client/dist/)
pnpm build:client

# Or watch mode during development
cd packages/slimmetry-client && pnpm dev
```

---

## Monorepo structure

```
open-slimmetry/
├── src/
│   ├── app/
│   │   ├── api/ingest/route.ts     # POST /api/ingest
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Dashboard shell with header + auto-refresh
│   │   │   └── page.tsx            # Server component — queries DB, renders UI
│   │   ├── layout.tsx
│   │   └── page.tsx                # Redirects to /dashboard
│   ├── components/
│   │   ├── DashboardShell.tsx      # Auto-refresh toggle
│   │   ├── LogDetail.tsx           # Slide-in detail panel
│   │   ├── LogSearch.tsx           # Filter bar (client component)
│   │   ├── LogTable.tsx            # Paginated log table (client component)
│   │   └── StatsBar.tsx            # Total + per-type counts
│   └── lib/
│       ├── db.ts                   # SQLite singleton, schema init
│       ├── queries.ts              # getLogs(), getStats(), getDistinctValues()
│       └── retention.ts            # Hourly cron — prunes old rows
├── packages/
│   └── slimmetry-client/           # slimmetry-next client library
│       └── src/index.ts
├── docker/
│   └── docker-compose.yml
├── instrumentation.ts              # Starts retention cron on server boot
├── Dockerfile
├── .env.example
└── data/                           # SQLite database (gitignored, created at runtime)
```
