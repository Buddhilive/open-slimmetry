# slimmetry-next

Lightweight logging client for [Open Slimmetry](https://github.com/buddhilive/open-slimmetry) — a self-hosted observability server for Next.js beta apps.

## Installation

```bash
npm install slimmetry-next
# or
pnpm add slimmetry-next
```

## Setup

Create a shared logger instance (do this once, then import it throughout your app):

```ts
// lib/logger.ts
import { createSlimmetry } from 'slimmetry-next'

export const logger = createSlimmetry({
  baseUrl: process.env.NEXT_PUBLIC_SLIMMETRY_URL!,
  service: 'my-beta-app',
  environment: 'beta',
})
```

## Usage

```ts
import { logger } from '@/lib/logger'

// Basic log
logger.send({ log: 'User signed up' })

// With logType
logger.send({ logType: 'info', log: 'Onboarding step completed' })

// With traceId to correlate events across client and server
logger.send({ traceId: requestId, logType: 'error', log: 'Payment failed: card declined' })

// Awaited when ordering matters
await logger.send({ traceId: jobId, logType: 'debug', log: 'Background job started' })
```

## API

### `createSlimmetry(config)`

| Option | Type | Required | Description |
|---|---|---|---|
| `baseUrl` | `string` | yes | URL of the Slimmetry server, e.g. `http://localhost:3000` |
| `service` | `string` | no | Name of this application — attached to every log |
| `environment` | `string` | no | e.g. `"beta"`, `"staging"` |
| `silent` | `boolean` | no | Suppress all console warnings from the library (default: `false`) |

Returns a `SlimmetryLogger` with a single method:

### `logger.send(payload)`

| Field | Type | Required | Description |
|---|---|---|---|
| `log` | `string` | yes | The log message |
| `logType` | `string` | no | e.g. `"error"`, `"info"`, `"warn"`, `"debug"`, or any custom string |
| `traceId` | `string` | no | Correlation ID to group related events |

Returns `Promise<void>`. Never throws — network errors are swallowed (with a console warning unless `silent: true`).

## Behaviour

- `send()` never throws or rejects. Network failures are silently discarded so observability calls never crash your application.
- All three payload fields must be strings. Passing a non-string value emits a warning and skips the send.
- Uses native `fetch` — no polyfill needed for Next.js 13+ (Node 18+) or modern browsers.
- Zero runtime dependencies.
