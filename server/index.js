import app from './app.js'
import { testConnection } from './db/config_pg.js'

const PORT = process.env.PORT || 5000

const dbConnected = await testConnection()

if (!dbConnected) {
  console.error(`
  Database Connection Failed! Check your DATABASE_URL configuration.
  `)
}

app.listen(PORT, () => {
  console.log(`
  ┌──────────────────────────────────────────────────┐
  │   Stylo API v3.1                                 │
  │   Server:   http://localhost:${PORT}
  │   Database: ${dbConnected ? 'Connected' : 'Disconnected'}
  │   Mode:     ${process.env.NODE_ENV || 'development'}
  └──────────────────────────────────────────────────┘
  `)
})
