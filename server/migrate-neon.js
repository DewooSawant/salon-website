// One-shot migration runner for Neon.
// Usage (from server/ dir): DATABASE_URL="postgresql://..." node migrate-neon.js
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const __dirname = dirname(fileURLToPath(import.meta.url))
const sqlPath = join(__dirname, 'db', 'migration_v2_postgres.sql')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const sql = readFileSync(sqlPath, 'utf8')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

console.log(`Running migration (${sql.length} chars) against Neon...`)
try {
  await pool.query(sql)
  console.log('✓ Migration applied successfully')
} catch (err) {
  console.error('✗ Migration failed:', err.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
