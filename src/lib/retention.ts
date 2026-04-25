import cron from 'node-cron'
import { getDb } from './db'

export function startRetentionJob(): void {
  const retentionDays = parseInt(process.env.RETENTION_DAYS ?? '7', 10)
  const maxDbMb = parseInt(process.env.MAX_DB_MB ?? '500', 10)

  cron.schedule('0 * * * *', () => {
    try {
      const db = getDb()
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()

      const result = db
        .prepare(`DELETE FROM logs WHERE received_at < ?`)
        .run(cutoff)

      db.pragma('wal_checkpoint(TRUNCATE)')

      const { total } = db
        .prepare('SELECT COUNT(*) as total FROM logs')
        .get() as { total: number }

      const { size } = db
        .prepare(`SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()`)
        .get() as { size: number }

      const sizeMb = size / (1024 * 1024)
      console.log(
        `[retention] deleted=${result.changes} remaining=${total} db_size=${sizeMb.toFixed(1)}MB`
      )

      if (sizeMb > maxDbMb) {
        console.warn(`[retention] WARNING: DB size ${sizeMb.toFixed(1)}MB exceeds MAX_DB_MB=${maxDbMb}`)
      }
    } catch (err) {
      console.error('[retention] job failed:', err)
    }
  })

  console.log(`[retention] job started — retaining ${retentionDays} days, max ${maxDbMb}MB`)
}
