import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  lazyConnect: true,
})

redis.on('error', (err) => console.error('Redis error:', err.message))
redis.on('connect', () => console.log('  Redis:    Connected'))

try { await redis.connect() } catch {}

// Cache wrapper with TTL
export async function cached(key, ttlSeconds, fetcher) {
  try {
    const hit = await redis.get(key)
    if (hit) return JSON.parse(hit)
  } catch {}

  const data = await fetcher()

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data))
  } catch {}

  return data
}

// Invalidate by pattern
export async function invalidate(pattern) {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  } catch {}
}

export default redis
