/// <reference types="jest" />

import { rateLimit } from '../rate-limiter'

describe('rateLimit', () => {
    let now: number
    let dateSpy: jest.SpyInstance

    beforeEach(() => {
        now = 1_000_000
        dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => now)
    })

    afterEach(() => {
        dateSpy.mockRestore()
    })

    it('G1 allows the first request and decrements remaining', () => {
        const r = rateLimit({ bucket: 'b1', identifier: 'ip1', limit: 3, windowMs: 1000 })
        expect(r.allowed).toBe(true)
        expect(r.remaining).toBe(2)
        expect(r.retryAfterSeconds).toBe(0)
    })

    it('G2 blocks once limit is reached and reports retryAfter', () => {
        rateLimit({ bucket: 'b2', identifier: 'ip2', limit: 2, windowMs: 5_000 })
        rateLimit({ bucket: 'b2', identifier: 'ip2', limit: 2, windowMs: 5_000 })
        const r = rateLimit({ bucket: 'b2', identifier: 'ip2', limit: 2, windowMs: 5_000 })

        expect(r.allowed).toBe(false)
        expect(r.remaining).toBe(0)
        expect(r.retryAfterSeconds).toBeGreaterThanOrEqual(1)
    })

    it('G3 resets the bucket after the window expires', () => {
        rateLimit({ bucket: 'b3', identifier: 'ip3', limit: 1, windowMs: 1_000 })
        let r = rateLimit({ bucket: 'b3', identifier: 'ip3', limit: 1, windowMs: 1_000 })
        expect(r.allowed).toBe(false)

        now += 1_500
        r = rateLimit({ bucket: 'b3', identifier: 'ip3', limit: 1, windowMs: 1_000 })
        expect(r.allowed).toBe(true)
    })

    it('G4 keeps buckets isolated per identifier', () => {
        rateLimit({ bucket: 'b4', identifier: 'ipA', limit: 1, windowMs: 5_000 })
        const r = rateLimit({ bucket: 'b4', identifier: 'ipB', limit: 1, windowMs: 5_000 })
        expect(r.allowed).toBe(true)
    })

    it('G5 keeps buckets isolated per bucket name for the same identifier', () => {
        rateLimit({ bucket: 'login', identifier: 'ip5', limit: 1, windowMs: 5_000 })
        const r = rateLimit({ bucket: 'register', identifier: 'ip5', limit: 1, windowMs: 5_000 })
        expect(r.allowed).toBe(true)
    })
})
