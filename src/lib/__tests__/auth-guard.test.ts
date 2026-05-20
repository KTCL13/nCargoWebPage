/// <reference types="jest" />

jest.mock('@/modules/auth/services/jwt.service', () => ({
    jwtService: { verify: jest.fn() },
}))

import { getAuthEmployee, requireAdmin } from '../auth-guard'
import { jwtService } from '@/modules/auth/services/jwt.service'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq(authHeader: string | null) {
    return {
        headers: { get: (k: string) => (k.toLowerCase() === 'authorization' ? authHeader : null) },
    } as any
}

describe('auth-guard.getAuthEmployee', () => {
    afterEach(() => jest.clearAllMocks())

    it('G1 happy path: returns the decoded payload', () => {
        mocked(jwtService.verify).mockReturnValue({ id: 1, email: 'a@b.c', role: 'ADMIN' })

        const out = getAuthEmployee(makeReq('Bearer good-token'))

        expect(jwtService.verify).toHaveBeenCalledWith('good-token')
        expect(out).toEqual({ id: 1, email: 'a@b.c', role: 'ADMIN' })
    })

    it('G2 throws when Authorization header is missing', () => {
        expect(() => getAuthEmployee(makeReq(null))).toThrow('Token no proporcionado')
        expect(jwtService.verify).not.toHaveBeenCalled()
    })

    it('G3 throws when header is not Bearer scheme', () => {
        expect(() => getAuthEmployee(makeReq('Basic abc'))).toThrow('Token no proporcionado')
    })

    it('G4 propagates jwt verify errors', () => {
        mocked(jwtService.verify).mockImplementation(() => {
            throw new Error('Token inválido o expirado')
        })
        expect(() => getAuthEmployee(makeReq('Bearer bad'))).toThrow('Token inválido o expirado')
    })
})

describe('auth-guard.requireAdmin', () => {
    afterEach(() => jest.clearAllMocks())

    it('G1 happy path: returns employee when role is ADMIN', () => {
        mocked(jwtService.verify).mockReturnValue({ id: 1, email: 'a@b.c', role: 'ADMIN' })
        const out = requireAdmin(makeReq('Bearer x'))
        expect(out.role).toBe('ADMIN')
    })

    it('G2 throws Forbidden when role is EMPLOYEE', () => {
        mocked(jwtService.verify).mockReturnValue({ id: 2, email: 'e@b.c', role: 'EMPLOYEE' })
        expect(() => requireAdmin(makeReq('Bearer x'))).toThrow(/Forbidden/)
    })

    it('G3 propagates underlying token errors before role check', () => {
        expect(() => requireAdmin(makeReq(null))).toThrow('Token no proporcionado')
    })
})
