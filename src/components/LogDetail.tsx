'use client'

import type { LogRow } from '@/lib/queries'

interface Props {
  log: LogRow | null
  onClose: () => void
}

const LOG_TYPE_COLORS: Record<string, string> = {
  error: 'bg-red-500/20 text-red-400 ring-red-500/30',
  warn: 'bg-amber-500/20 text-amber-400 ring-amber-500/30',
  info: 'bg-blue-500/20 text-blue-400 ring-blue-500/30',
  debug: 'bg-zinc-500/20 text-zinc-400 ring-zinc-500/30',
}

function typeColor(logType: string | null): string {
  if (!logType) return 'bg-zinc-700/20 text-zinc-500'
  return LOG_TYPE_COLORS[logType.toLowerCase()] ?? 'bg-purple-500/20 text-purple-400 ring-purple-500/30'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  })
}

export function LogDetail({ log, onClose }: Props) {
  if (!log) return null

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1" />
      <div
        className="w-full max-w-xl h-full bg-zinc-900 border-l border-zinc-700 flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <span className="text-sm font-semibold text-zinc-100">Log #{log.id}</span>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <Field label="Received at" value={formatDate(log.received_at)} mono />

          {log.log_type && (
            <div>
              <span className="text-xs text-zinc-500 block mb-1">Type</span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${typeColor(log.log_type)}`}>
                {log.log_type}
              </span>
            </div>
          )}

          {log.service && <Field label="Service" value={log.service} />}
          {log.environment && <Field label="Environment" value={log.environment} />}

          {log.trace_id && (
            <Field label="Trace ID" value={log.trace_id} mono />
          )}

          <div>
            <span className="text-xs text-zinc-500 block mb-1">Log</span>
            <pre className="whitespace-pre-wrap break-all rounded-md bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-100 font-mono leading-relaxed">
              {log.log}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-zinc-500 block mb-1">{label}</span>
      <span className={`text-sm text-zinc-200 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
