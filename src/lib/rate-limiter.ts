// Simple in-memory rate limiter keyed by (bucket, identifier).
// Suitable for single-process dev / small deployments. For multi-instance
// production, replace the Map-backed store with Redis / Upstash.

type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

export type RateLimitResult = {
    allowed: boolean
    remaining: number
    retryAfterSeconds: number
}

export function rateLimit(opts: {
    bucket: string
    identifier: string
    limit: number
    windowMs: number
}): RateLimitResult {
    const key = `${opts.bucket}::${opts.identifier}`
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now >= entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + opts.windowMs })
        return { allowed: true, remaining: opts.limit - 1, retryAfterSeconds: 0 }
    }

    if (entry.count >= opts.limit) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
        }
    }

    entry.count += 1
    return { allowed: true, remaining: opts.limit - entry.count, retryAfterSeconds: 0 }
}

// Periodic cleanup so the Map does not grow unbounded.
if (typeof globalThis !== 'undefined' && !(globalThis as any).__rateLimitCleanup) {
    ;(globalThis as any).__rateLimitCleanup = setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of store.entries()) {
            if (now >= entry.resetAt) store.delete(key)
        }
    }, 60_000)
    // Don't keep the process alive solely for cleanup
    ;(globalThis as any).__rateLimitCleanup?.unref?.()
}
