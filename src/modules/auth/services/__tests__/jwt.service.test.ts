/// <reference types="jest" />

import { jwtService } from '../jwt.service'

const STRONG_SECRET = 'a'.repeat(48)

describe('jwt.service', () => {
    const originalSecret = process.env.JWT_SECRET

    afterEach(() => {
        process.env.JWT_SECRET = originalSecret
    })

    describe('sign', () => {
        it('G1 happy path: returns a non-empty JWT string with strong secret', () => {
            process.env.JWT_SECRET = STRONG_SECRET
            const token = jwtService.sign({ id: 1, email: 'a@b.c', role: 'ADMIN' })
            expect(typeof token).toBe('string')
            expect(token.split('.')).toHaveLength(3)
        })

        it('G2 throws when JWT_SECRET is not defined', () => {
            delete process.env.JWT_SECRET
            expect(() => jwtService.sign({ id: 1, email: 'x', role: 'ADMIN' })).toThrow(/JWT_SECRET/)
        })

        it('G3 rejects known weak secret values at runtime', () => {
            process.env.JWT_SECRET = 'ncargo_secret_key_change_in_production'
            expect(() => jwtService.sign({ id: 1, email: 'x', role: 'ADMIN' })).toThrow(/inseguro/)
        })

        it('G4 rejects short secrets (<32 chars) and reports the length received', () => {
            process.env.JWT_SECRET = 'too-short'
            expect(() => jwtService.sign({ id: 1, email: 'x', role: 'ADMIN' })).toThrow(/demasiado corto.*9 chars/)
        })
    })

    describe('verify', () => {
        it('G1 happy path: round-trips a payload signed with the same secret', () => {
            process.env.JWT_SECRET = STRONG_SECRET
            const token = jwtService.sign({ id: 5, email: 'r@t.c', role: 'EMPLOYEE' })
            const payload = jwtService.verify(token)
            expect(payload).toMatchObject({ id: 5, email: 'r@t.c', role: 'EMPLOYEE' })
        })

        it('G2 throws on tampered / invalid tokens', () => {
            process.env.JWT_SECRET = STRONG_SECRET
            expect(() => jwtService.verify('not.a.jwt')).toThrow(/Token inválido/)
        })

        it('G3 throws when verifying with a different secret', () => {
            process.env.JWT_SECRET = STRONG_SECRET
            const token = jwtService.sign({ id: 1, email: 'x', role: 'ADMIN' })
            process.env.JWT_SECRET = 'b'.repeat(48)
            expect(() => jwtService.verify(token)).toThrow(/Token inválido/)
        })
    })
})
