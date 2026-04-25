'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { LogRow } from '@/lib/queries'
import { LogDetail } from './LogDetail'

interface Props {
  rows: LogRow[]
  total: number
  page: number
}

const LOG_TYPE_COLORS: Record<string, string> = {
  error: 'bg-red-500/20 text-red-400 ring-red-500/30',
  warn: 'bg-amber-500/20 text-amber-400 ring-amber-500/30',
  info: 'bg-blue-500/20 text-blue-400 ring-blue-500/30',
  debug: 'bg-zinc-500/20 text-zinc-400 ring-zinc-500/30',
}

function typeColor(logType: string | null): string {
  if (!logType) return ''
  return LOG_TYPE_COLORS[logType.toLowerCase()] ?? 'bg-purple-500/20 text-purple-400 ring-purple-500/30'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const PAGE_SIZE = 50

export function LogTable({ rows, total, page }: Props) {
  const [selected, setSelected] = useState<LogRow | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  function filterByTrace(traceId: string, e: React.MouseEvent) {
    e.stopPropagation()
    const params = new URLSearchParams(searchParams.toString())
    params.set('traceId', traceId)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-600 text-sm gap-2">
        <span className="text-3xl">◌</span>
        <span>No logs match the current filters</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-zinc-950 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-2 text-xs font-medium text-zinc-500 whitespace-nowrap">Time</th>
              <th className="px-4 py-2 text-xs font-medium text-zinc-500">Type</th>
              <th className="px-4 py-2 text-xs font-medium text-zinc-500">Service</th>
              <th className="px-4 py-2 text-xs font-medium text-zinc-500 w-full">Log</th>
              <th className="px-4 py-2 text-xs font-medium text-zinc-500">Trace ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => setSelected(row)}
                className="cursor-pointer hover:bg-zinc-800/40 transition-colors"
              >
                <td className="px-4 py-2.5 text-zinc-500 whitespace-nowrap font-mono text-xs">
                  {formatDate(row.received_at)}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {row.log_type ? (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${typeColor(row.log_type)}`}>
                      {row.log_type}
                    </span>
                  ) : (
                    <span className="text-zinc-700">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-zinc-400 whitespace-nowrap text-xs">
                  {row.service ?? <span className="text-zinc-700">—</span>}
                </td>
                <td className="px-4 py-2.5 text-zinc-200 font-mono text-xs max-w-0">
                  <span className="block truncate" title={row.log}>
                    {row.log.length > 120 ? row.log.slice(0, 120) + '…' : row.log}
                  </span>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {row.trace_id ? (
                    <button
                      onClick={(e) => filterByTrace(row.trace_id!, e)}
                      title="Filter by this trace ID"
                      className="font-mono text-xs text-zinc-500 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-200 rounded px-1.5 py-0.5 transition-colors max-w-28 truncate block"
                    >
                      {row.trace_id}
                    </button>
                  ) : (
                    <span className="text-zinc-700">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-950 text-xs text-zinc-500">
        <span>
          {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–
          {Math.min(page * PAGE_SIZE, total).toLocaleString()} of {total.toLocaleString()}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="px-2.5 py-1 rounded border border-zinc-700 disabled:opacity-30 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
          >
            ←
          </button>
          <span className="px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="px-2.5 py-1 rounded border border-zinc-700 disabled:opacity-30 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
          >
            →
          </button>
        </div>
      </div>

      <LogDetail log={selected} onClose={() => setSelected(null)} />
    </>
  )
}
