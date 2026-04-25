import { Suspense } from 'react'
import { getLogs, getStats, getDistinctValues } from '@/lib/queries'
import { StatsBar } from '@/components/StatsBar'
import { LogSearch } from '@/components/LogSearch'
import { LogTable } from '@/components/LogTable'

interface SearchParams {
  search?: string
  logType?: string
  service?: string
  environment?: string
  from?: string
  to?: string
  traceId?: string
  page?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  const [stats, { rows, total }, logTypes, services, environments] = await Promise.all([
    Promise.resolve(getStats()),
    Promise.resolve(
      getLogs({
        search: params.search,
        logType: params.logType,
        service: params.service,
        environment: params.environment,
        from: params.from ? params.from.replace('T', ' ') : undefined,
        to: params.to ? params.to.replace('T', ' ') : undefined,
        traceId: params.traceId,
        page,
      })
    ),
    Promise.resolve(getDistinctValues('log_type')),
    Promise.resolve(getDistinctValues('service')),
    Promise.resolve(getDistinctValues('environment')),
  ])

  return (
    <>
      <StatsBar stats={stats} />

      <Suspense>
        <LogSearch
          logTypes={logTypes}
          services={services}
          environments={environments}
        />
      </Suspense>

      {params.traceId && (
        <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/30 text-xs text-zinc-400 flex items-center gap-2">
          <span>Filtering by trace:</span>
          <code className="font-mono text-zinc-300 bg-zinc-800 rounded px-1.5 py-0.5">
            {params.traceId}
          </code>
        </div>
      )}

      <Suspense>
        <LogTable rows={rows} total={total} page={page} />
      </Suspense>
    </>
  )
}
