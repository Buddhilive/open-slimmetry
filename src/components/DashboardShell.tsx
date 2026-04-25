'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  children: React.ReactNode
}

export function DashboardShell({ children }: Props) {
  const router = useRouter()
  const [autoRefresh, setAutoRefresh] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => router.refresh(), 10_000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, router])

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight text-zinc-100">
            Open Slimmetry
          </span>
          <span className="text-xs text-zinc-600">observability</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-0"
          />
          <span className="text-xs text-zinc-500">Auto-refresh (10s)</span>
          {autoRefresh && (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          )}
        </label>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  )
}
