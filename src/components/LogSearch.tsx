'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'

interface Props {
  logTypes: string[]
  services: string[]
  environments: string[]
}

export function LogSearch({ logTypes, services, environments }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [searchParams, pathname, router]
  )

  const get = (key: string) => searchParams.get(key) ?? ''

  return (
    <div className={`flex flex-wrap gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-950 ${isPending ? 'opacity-70' : ''}`}>
      <input
        type="search"
        placeholder="Search logs…"
        defaultValue={get('search')}
        onChange={(e) => updateParam('search', e.target.value)}
        className="flex-1 min-w-48 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />

      <select
        value={get('logType')}
        onChange={(e) => updateParam('logType', e.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      >
        <option value="">All types</option>
        {logTypes.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <select
        value={get('service')}
        onChange={(e) => updateParam('service', e.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      >
        <option value="">All services</option>
        {services.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        value={get('environment')}
        onChange={(e) => updateParam('environment', e.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      >
        <option value="">All envs</option>
        {environments.map((e) => (
          <option key={e} value={e}>{e}</option>
        ))}
      </select>

      <input
        type="datetime-local"
        value={get('from')}
        onChange={(e) => updateParam('from', e.target.value)}
        title="From"
        className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />

      <input
        type="datetime-local"
        value={get('to')}
        onChange={(e) => updateParam('to', e.target.value)}
        title="To"
        className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />

      {get('search') || get('logType') || get('service') || get('environment') || get('from') || get('to') || get('traceId') ? (
        <button
          onClick={() => {
            startTransition(() => router.push(pathname))
          }}
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
        >
          Clear
        </button>
      ) : null}
    </div>
  )
}
