// This file is kept for backward compatibility
// The actual database is now MySQL, configured in db/config.js

import pool, { testConnection } from './config.js'

export async function initializeDatabase() {
  const connected = await testConnection()
  if (connected) {
    console.log('✅ MySQL Database initialized successfully')
  } else {
    console.log('⚠️  MySQL Database not connected. Run `npm run setup` to initialize.')
  }
  return connected
}

export default pool
