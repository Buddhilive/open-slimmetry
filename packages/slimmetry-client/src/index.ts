export interface SlimmetryConfig {
  baseUrl: string
  service?: string
  environment?: string
  silent?: boolean
}

export interface LogPayload {
  traceId?: string
  logType?: string
  log: string
}

export interface SlimmetryLogger {
  send(payload: LogPayload): Promise<void>
}

export function createSlimmetry(config: SlimmetryConfig): SlimmetryLogger {
  const { baseUrl, service, environment, silent = false } = config
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/ingest`

  function warn(msg: string): void {
    if (!silent) console.warn(`[slimmetry] ${msg}`)
  }

  async function send(payload: LogPayload): Promise<void> {
    if (typeof payload.log !== 'string' || payload.log.trim() === '') {
      warn('`log` must be a non-empty string — skipping')
      return
    }

    if (payload.traceId !== undefined && typeof payload.traceId !== 'string') {
      warn('`traceId` must be a string — skipping')
      return
    }

    if (payload.logType !== undefined && typeof payload.logType !== 'string') {
      warn('`logType` must be a string — skipping')
      return
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traceId: payload.traceId,
          logType: payload.logType,
          log: payload.log,
          service,
          environment,
        }),
      })

      if (!res.ok) {
        warn(`server responded with ${res.status} ${res.statusText}`)
      }
    } catch (err) {
      warn(`network error — ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { send }
}
