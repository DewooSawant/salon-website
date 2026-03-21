import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'glamour_salon',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
})

// Test connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('✅ MySQL Database connected successfully')
    connection.release()
    return true
  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message)
    return false
  }
}

export default pool

