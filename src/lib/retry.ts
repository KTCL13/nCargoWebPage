const RETRYABLE_PATTERNS = [
    /ECONNREFUSED/,
    /ECONNRESET/,
    /ETIMEDOUT/,
    /ENOTFOUND/,
    /socket hang up/i,
    /fetch failed/i,
    /network/i,
    /timeout/i,
]

/** Returns true when the error looks like a transient infrastructure failure. */
export function isRetryable(error: unknown): boolean {
    if (!(error instanceof Error)) return false
    const msg = error.message

    // Hard failures — will never succeed on retry
    if (/no está configurado|Forbidden|Autenticación fallida|inválido|expirado/i.test(msg)) return false

    // AbortError from fetch signal
    if (error.name === 'AbortError') return true

    // Network / OS-level transients
    if (RETRYABLE_PATTERNS.some(p => p.test(msg))) return true

    // HTTP 5xx or 429 (rate-limit) from an external API
    if (/HTTP (5\d\d|429)/i.test(msg)) return true

    return false
}

type RetryOptions = {
    /** Total attempts including the first call. Default: 4 (= 3 retries). */
    maxAttempts?: number
    /** Base delay in ms for the first retry. Default: 500. */
    baseDelayMs?: number
    /** Upper bound for any single delay. Default: 8000. */
    maxDelayMs?: number
    /** Override the default retryability check. */
    shouldRetry?: (error: unknown) => boolean
}

/**
 * Calls `fn` up to `maxAttempts` times with exponential backoff + ±20 % jitter.
 * Throws immediately if the error is not retryable or all attempts are exhausted.
 *
 * Backoff schedule (default, before jitter):
 *   retry 1 → 500 ms
 *   retry 2 → 1 000 ms
 *   retry 3 → 2 000 ms
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    opts: RetryOptions = {},
): Promise<T> {
    const {
        maxAttempts = 4,
        baseDelayMs = 500,
        maxDelayMs = 8_000,
        shouldRetry = isRetryable,
    } = opts

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn()
        } catch (error) {
            if (attempt === maxAttempts || !shouldRetry(error)) throw error

            const base = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs)
            const jitter = base * 0.2 * (Math.random() * 2 - 1)
            await sleep(Math.max(0, Math.round(base + jitter)))
        }
    }

    // TypeScript requires a return path; the loop always throws on exhaustion above.
    /* istanbul ignore next */
    throw new Error('withRetry: unreachable')
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}
