import dotenv from 'dotenv'
import pg from 'pg'
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

dotenv.config()

// Neon's serverless driver uses WebSockets in Node; pipe in `ws`
neonConfig.webSocketConstructor = ws

const isNeon = (process.env.DATABASE_URL || '').includes('neon.tech')
const isProd = process.env.NODE_ENV === 'production'

const pool = process.env.DATABASE_URL
  ? (isNeon
      ? new NeonPool({ connectionString: process.env.DATABASE_URL })
      : new pg.Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: isProd ? { rejectUnauthorized: false } : false,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        }))
  : new pg.Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'salon_marketplace',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

export async function testConnection() {
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    return true
  } catch (error) {
    console.error('Database connection failed:', error.message)
    return false
  }
}

// Helper to match mysql2 query style: returns [rows] instead of { rows }
export async function query(text, params) {
  const result = await pool.query(text, params)
  return [result.rows, result]
}

export { pool }
export default { query, pool, testConnection }
