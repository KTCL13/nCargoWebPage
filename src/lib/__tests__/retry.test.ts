/// <reference types="jest" />

import { withRetry, isRetryable } from '../retry'

// All retry tests use baseDelayMs: 0 to skip real waiting.

describe('isRetryable', () => {
    it('returns true for AbortError', () => {
        const e = new Error('aborted')
        e.name = 'AbortError'
        expect(isRetryable(e)).toBe(true)
    })

    it('returns true for ECONNREFUSED', () => {
        expect(isRetryable(new Error('connect ECONNREFUSED 127.0.0.1:80'))).toBe(true)
    })

    it('returns true for HTTP 503', () => {
        expect(isRetryable(new Error('Odoo HTTP 503'))).toBe(true)
    })

    it('returns true for HTTP 429', () => {
        expect(isRetryable(new Error('Odoo HTTP 429'))).toBe(true)
    })

    it('returns false for auth errors', () => {
        expect(isRetryable(new Error('Autenticación fallida con Odoo'))).toBe(false)
    })

    it('returns false for config errors', () => {
        expect(isRetryable(new Error('Odoo no está configurado: ...'))).toBe(false)
    })

    it('returns false for non-Error values', () => {
        expect(isRetryable('string error')).toBe(false)
        expect(isRetryable(null)).toBe(false)
    })

    it('returns false for generic provider-rejected errors', () => {
        expect(isRetryable(new Error('provider rejected'))).toBe(false)
    })
})

describe('withRetry', () => {
    const NO_DELAY = { baseDelayMs: 0 }

    it('R1 resolves immediately on success', async () => {
        const fn = jest.fn().mockResolvedValue('ok')
        await expect(withRetry(fn, NO_DELAY)).resolves.toBe('ok')
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('R2 retries up to 3 times (4 total attempts) on retryable errors', async () => {
        const fn = jest.fn().mockRejectedValue(new Error('ECONNRESET'))
        await expect(withRetry(fn, NO_DELAY)).rejects.toThrow('ECONNRESET')
        expect(fn).toHaveBeenCalledTimes(4)
    })

    it('R3 does not retry on non-retryable errors', async () => {
        const fn = jest.fn().mockRejectedValue(new Error('Autenticación fallida con Odoo'))
        await expect(withRetry(fn, NO_DELAY)).rejects.toThrow('Autenticación fallida')
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('R4 succeeds on the second attempt after a retryable first failure', async () => {
        const fn = jest.fn()
            .mockRejectedValueOnce(new Error('fetch failed'))
            .mockResolvedValue('recovered')
        await expect(withRetry(fn, NO_DELAY)).resolves.toBe('recovered')
        expect(fn).toHaveBeenCalledTimes(2)
    })

    it('R5 respects custom maxAttempts', async () => {
        const fn = jest.fn().mockRejectedValue(new Error('ETIMEDOUT'))
        await expect(withRetry(fn, { ...NO_DELAY, maxAttempts: 2 })).rejects.toThrow()
        expect(fn).toHaveBeenCalledTimes(2)
    })
})
