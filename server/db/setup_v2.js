import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') })

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
}

async function setup() {
  let connection

  try {
    console.log('\n  Setting up Stylo Marketplace Database...\n')

    connection = await mysql.createConnection(DB_CONFIG)

    // Read and execute schema
    const schemaPath = join(dirname(fileURLToPath(import.meta.url)), 'migration_v2_multi_salon.sql')
    const schema = readFileSync(schemaPath, 'utf8')

    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const stmt of statements) {
      try {
        await connection.query(stmt)
      } catch (err) {
        // Ignore duplicate key errors for sample data
        if (err.code !== 'ER_DUP_ENTRY' && err.code !== 'ER_TABLE_EXISTS_ERROR') {
          console.error(`  Warning: ${err.message.substring(0, 100)}`)
        }
      }
    }

    console.log('  Tables created successfully')

    // Hash passwords for sample data
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12)
    const customerPassword = await bcrypt.hash('customer123', 12)

    // Update sample passwords
    await connection.query('USE salon_marketplace')

    await connection.query(
      'UPDATE platform_admins SET password = ? WHERE email = ?',
      [hashedPassword, 'admin@stylo.com']
    ).catch(() => {})

    await connection.query(
      'UPDATE salon_owners SET password = ? WHERE password = ?',
      [hashedPassword, '$2b$12$placeholder']
    ).catch(() => {})

    await connection.query(
      'UPDATE customers SET password = ? WHERE password = ?',
      [customerPassword, '$2b$12$placeholder']
    ).catch(() => {})

    console.log('  Sample data passwords hashed')

    // Print summary
    const [salons] = await connection.query('SELECT COUNT(*) as c FROM salons')
    const [owners] = await connection.query('SELECT COUNT(*) as c FROM salon_owners')
    const [services] = await connection.query('SELECT COUNT(*) as c FROM services')
    const [customers] = await connection.query('SELECT COUNT(*) as c FROM customers')

    console.log(`
  ┌──────────────────────────────────────────────────┐
  │  Stylo Marketplace - Setup Complete          │
  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━            │
  │                                                  │
  │  Database:  salon_marketplace                    │
  │  Salons:    ${salons[0].c}                                     │
  │  Owners:    ${owners[0].c}                                     │
  │  Services:  ${services[0].c}                                     │
  │  Customers: ${customers[0].c}                                     │
  │                                                  │
  │  Login credentials:                              │
  │  ─────────────────                               │
  │  Salon Owner:  rajesh@glamourcuts.com / admin123 │
  │  Customer:     +91 99999 00001 / customer123     │
  │  Platform:     admin@stylo.com / admin123    │
  │                                                  │
  └──────────────────────────────────────────────────┘
    `)
  } catch (error) {
    console.error('  Setup failed:', error.message)
    process.exit(1)
  } finally {
    if (connection) await connection.end()
  }
}

setup()
