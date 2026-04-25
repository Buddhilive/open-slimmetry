import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { success: false, error: 'Request body must be a JSON object' },
        { status: 400, headers: corsHeaders }
      )
    }

    const { traceId, logType, log, service, environment } = body as Record<string, unknown>

    if (typeof log !== 'string' || log.trim() === '') {
      return NextResponse.json(
        { success: false, error: '`log` is required and must be a non-empty string' },
        { status: 400, headers: corsHeaders }
      )
    }

    const db = getDb()
    const result = db
      .prepare(
        `INSERT INTO logs (trace_id, log_type, log, service, environment)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        typeof traceId === 'string' ? traceId.trim() || null : null,
        typeof logType === 'string' ? logType.trim() || null : null,
        log.trim(),
        typeof service === 'string' ? service.trim() || null : null,
        typeof environment === 'string' ? environment.trim() || null : null
      )

    return NextResponse.json(
      { success: true, id: Number(result.lastInsertRowid) },
      { headers: corsHeaders }
    )
  } catch (err) {
    console.error('[ingest] error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
