const WINDOW_MS = 60 * 60 * 1000
const MAX_REQUESTS = 5

type Entry = { count: number; windowStart: number }

// In-memory — resets on cold start and isn't shared across serverless
// instances. Fine for a low-traffic waitlist; swap for Upstash/Redis
// if this needs to hold under real scale or multi-instance deploys.
const store = new Map<string, Entry>()

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now()

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (store.size > 5000) {
    for (const [k, entry] of store) {
      if (now - entry.windowStart > WINDOW_MS) store.delete(k)
    }
  }

  const entry = store.get(key)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  entry.count += 1
  return { allowed: true, remaining: MAX_REQUESTS - entry.count }
}
