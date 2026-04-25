import { getDb } from './db'

export interface LogRow {
  id: number
  received_at: string
  trace_id: string | null
  log_type: string | null
  log: string
  service: string | null
  environment: string | null
}

export interface LogFilters {
  search?: string
  logType?: string
  service?: string
  environment?: string
  from?: string
  to?: string
  traceId?: string
  page?: number
}

export interface Stats {
  total: number
  byType: Array<{ log_type: string; count: number }>
}

const PAGE_SIZE = 50

export function getLogs(filters: LogFilters): { rows: LogRow[]; total: number } {
  const db = getDb()
  const page = Math.max(1, filters.page ?? 1)
  const offset = (page - 1) * PAGE_SIZE

  const conditions: string[] = []
  const params: unknown[] = []

  if (filters.logType) {
    conditions.push('logs.log_type = ?')
    params.push(filters.logType)
  }
  if (filters.service) {
    conditions.push('logs.service = ?')
    params.push(filters.service)
  }
  if (filters.environment) {
    conditions.push('logs.environment = ?')
    params.push(filters.environment)
  }
  if (filters.from) {
    conditions.push('logs.received_at >= ?')
    params.push(filters.from)
  }
  if (filters.to) {
    conditions.push('logs.received_at <= ?')
    params.push(filters.to)
  }
  if (filters.traceId) {
    conditions.push('logs.trace_id = ?')
    params.push(filters.traceId)
  }

  if (filters.search) {
    const escaped = filters.search.replace(/"/g, '""')
    const ftsMatch = `"${escaped}"*`
    const extraWhere = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''

    const rows = db
      .prepare(
        `SELECT logs.* FROM logs_fts
         JOIN logs ON logs.id = logs_fts.rowid
         WHERE logs_fts MATCH ?
         ${extraWhere}
         ORDER BY logs.received_at DESC
         LIMIT ${PAGE_SIZE} OFFSET ${offset}`
      )
      .all(ftsMatch, ...params) as LogRow[]

    const { count } = db
      .prepare(
        `SELECT COUNT(*) as count FROM logs_fts
         JOIN logs ON logs.id = logs_fts.rowid
         WHERE logs_fts MATCH ?
         ${extraWhere}`
      )
      .get(ftsMatch, ...params) as { count: number }

    return { rows, total: count }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const rows = db
    .prepare(
      `SELECT * FROM logs
       ${whereClause}
       ORDER BY received_at DESC
       LIMIT ${PAGE_SIZE} OFFSET ${offset}`
    )
    .all(...params) as LogRow[]

  const { count } = db
    .prepare(`SELECT COUNT(*) as count FROM logs ${whereClause}`)
    .get(...params) as { count: number }

  return { rows, total: count }
}

export function getStats(): Stats {
  const db = getDb()

  const { total } = db
    .prepare('SELECT COUNT(*) as total FROM logs')
    .get() as { total: number }

  const byType = db
    .prepare(
      `SELECT log_type, COUNT(*) as count FROM logs
       WHERE log_type IS NOT NULL AND log_type != ''
       GROUP BY log_type
       ORDER BY count DESC`
    )
    .all() as Array<{ log_type: string; count: number }>

  return { total, byType }
}

export function getDistinctValues(
  column: 'log_type' | 'service' | 'environment'
): string[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT DISTINCT ${column} FROM logs
       WHERE ${column} IS NOT NULL AND ${column} != ''
       ORDER BY ${column}`
    )
    .all() as Array<Record<string, string>>
  return rows.map((r) => r[column])
}
