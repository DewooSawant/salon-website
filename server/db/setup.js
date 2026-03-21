import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n')

  // First connect without database to create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  })

  try {
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📦 Creating database and tables...')
    await connection.query(schema)
    console.log('✅ Database schema created successfully\n')

    // Create default admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@glamourcuts.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    await connection.query(`USE glamour_salon`)
    
    // Check if admin exists
    const [existingAdmin] = await connection.query(
      'SELECT id FROM admin_users WHERE email = ?',
      [adminEmail]
    )

    if (existingAdmin.length === 0) {
      await connection.query(
        `INSERT INTO admin_users (name, email, password, role, is_active) 
         VALUES (?, ?, ?, 'owner', TRUE)`,
        ['Salon Owner', adminEmail, hashedPassword]
      )
      console.log('👤 Default admin user created:')
      console.log(`   Email: ${adminEmail}`)
      console.log(`   Password: ${adminPassword}`)
      console.log('   ⚠️  Please change this password after first login!\n')
    } else {
      console.log('👤 Admin user already exists\n')
    }

    console.log('🎉 Database setup completed successfully!')
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  Next steps:')
    console.log('  1. Start the server: npm run dev')
    console.log('  2. Access admin panel: http://localhost:3000/admin')
    console.log('  3. Login with the credentials above')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    throw error
  } finally {
    await connection.end()
  }
}

setupDatabase().catch(console.error)

