import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new pg.Pool({
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
