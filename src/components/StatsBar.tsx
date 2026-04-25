import type { Stats } from '@/lib/queries'

interface Props {
  stats: Stats
}

const LOG_TYPE_COLORS: Record<string, string> = {
  error: 'bg-red-500/20 text-red-400 ring-red-500/30',
  warn: 'bg-amber-500/20 text-amber-400 ring-amber-500/30',
  info: 'bg-blue-500/20 text-blue-400 ring-blue-500/30',
  debug: 'bg-zinc-500/20 text-zinc-400 ring-zinc-500/30',
}

function typeColor(logType: string): string {
  return LOG_TYPE_COLORS[logType.toLowerCase()] ?? 'bg-purple-500/20 text-purple-400 ring-purple-500/30'
}

export function StatsBar({ stats }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
      <span className="text-xs text-zinc-500 mr-1">Total:</span>
      <span className="text-sm font-semibold text-zinc-100 mr-3">
        {stats.total.toLocaleString()}
      </span>

      {stats.byType.map(({ log_type, count }) => (
        <span
          key={log_type}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${typeColor(log_type)}`}
        >
          {log_type}
          <span className="opacity-70">{count.toLocaleString()}</span>
        </span>
      ))}

      {stats.total === 0 && (
        <span className="text-xs text-zinc-600">No logs yet — send your first event to /api/ingest</span>
      )}
    </div>
  )
}
