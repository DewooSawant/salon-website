import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') })

async function setup() {
  const adminClient = new pg.Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres'
  })

  try {
    console.log('\n  Setting up Stylo Marketplace (PostgreSQL + PostGIS)...\n')

    await adminClient.connect()

    // Create database if not exists
    const dbName = process.env.DB_NAME || 'salon_marketplace'
    const { rows } = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName])
    if (rows.length === 0) {
      await adminClient.query(`CREATE DATABASE ${dbName}`)
      console.log(`  Created database: ${dbName}`)
    } else {
      console.log(`  Database exists: ${dbName}`)
    }

    await adminClient.end()

    // Connect to the new database and run schema
    const client = new pg.Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: dbName
    })

    await client.connect()

    // Read and execute schema
    const schemaPath = join(dirname(fileURLToPath(import.meta.url)), 'migration_v2_postgres.sql')
    const schema = readFileSync(schemaPath, 'utf8')

    await client.query(schema)
    console.log('  Schema applied successfully')

    // Hash passwords for sample data
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12)
    const customerPassword = await bcrypt.hash('customer123', 12)

    await client.query('UPDATE platform_admins SET password = $1 WHERE password = $2', [hashedPassword, '$placeholder$'])
    await client.query('UPDATE salon_owners SET password = $1 WHERE password = $2', [hashedPassword, '$placeholder$'])
    await client.query('UPDATE customers SET password = $1 WHERE password = $2', [customerPassword, '$placeholder$'])

    console.log('  Passwords hashed')

    // Print summary
    const counts = {}
    for (const table of ['salons', 'salon_owners', 'services', 'stylists', 'customers', 'service_categories']) {
      const { rows } = await client.query(`SELECT COUNT(*) as c FROM ${table}`)
      counts[table] = rows[0].c
    }

    await client.end()

    console.log(`
  ┌──────────────────────────────────────────────────┐
  │  Stylo Marketplace - Setup Complete           │
  │  PostgreSQL + PostGIS                             │
  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━             │
  │                                                   │
  │  Database:    ${dbName.padEnd(20)}                │
  │  Salons:      ${String(counts.salons).padEnd(20)} │
  │  Owners:      ${String(counts.salon_owners).padEnd(20)} │
  │  Categories:  ${String(counts.service_categories).padEnd(20)} │
  │  Services:    ${String(counts.services).padEnd(20)} │
  │  Stylists:    ${String(counts.stylists).padEnd(20)} │
  │  Customers:   ${String(counts.customers).padEnd(20)} │
  │                                                   │
  │  Credentials:                                     │
  │  Salon Owner: rajesh@glamourcuts.com / admin123   │
  │  Customer:    +919999900001 / customer123          │
  │  Platform:    admin@stylo.com / admin123       │
  │                                                   │
  └──────────────────────────────────────────────────┘
    `)
  } catch (error) {
    console.error('  Setup failed:', error.message)
    process.exit(1)
  }
}

setup()
