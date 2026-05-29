/// <reference types="jest" />

jest.mock('@/modules/auth/services/jwt.service', () => ({
    jwtService: { verify: jest.fn() },
}))

jest.mock('@/lib/prisma', () => ({
    prisma: {
        userSession: {
            findFirst: jest.fn(),
        },
    },
}))

import { getAuthEmployee, requireAdmin } from '../auth-guard'
import { jwtService } from '@/modules/auth/services/jwt.service'
import { prisma } from '@/lib/prisma'

const mockVerify = jwtService.verify as jest.Mock
const mockFindFirst = prisma.userSession.findFirst as jest.Mock

function makeReq(authHeader: string | null) {
    return {
        headers: { get: (k: string) => (k.toLowerCase() === 'authorization' ? authHeader : null) },
    } as any
}

const validPayload = { id: 1, email: 'a@b.c', role: 'ADMIN', jti: 'test-jti-uuid' }

describe('auth-guard.getAuthEmployee', () => {
    afterEach(() => jest.clearAllMocks())

    it('G1 happy path: returns the decoded payload when session is active', async () => {
        mockVerify.mockReturnValue(validPayload)
        mockFindFirst.mockResolvedValue({ id: 10 })

        const out = await getAuthEmployee(makeReq('Bearer good-token'))

        expect(jwtService.verify).toHaveBeenCalledWith('good-token')
        expect(mockFindFirst).toHaveBeenCalledWith(
            expect.objectContaining({ where: { tokenJti: 'test-jti-uuid', logoutAt: null } }),
        )
        expect(out).toMatchObject({ id: 1, email: 'a@b.c', role: 'ADMIN', jti: 'test-jti-uuid' })
    })

    it('G2 throws when Authorization header is missing', async () => {
        await expect(getAuthEmployee(makeReq(null))).rejects.toThrow('Token no proporcionado')
        expect(jwtService.verify).not.toHaveBeenCalled()
    })

    it('G3 throws when header is not Bearer scheme', async () => {
        await expect(getAuthEmployee(makeReq('Basic abc'))).rejects.toThrow('Token no proporcionado')
    })

    it('G4 propagates jwt verify errors', async () => {
        mockVerify.mockImplementation(() => { throw new Error('Token inválido o expirado') })
        await expect(getAuthEmployee(makeReq('Bearer bad'))).rejects.toThrow('Token inválido o expirado')
    })

    it('G5 throws when session is not found in DB (evicted or logged out)', async () => {
        mockVerify.mockReturnValue(validPayload)
        mockFindFirst.mockResolvedValue(null)

        await expect(getAuthEmployee(makeReq('Bearer x'))).rejects.toThrow('Sesión inválida o expirada')
    })
})

describe('auth-guard.requireAdmin', () => {
    afterEach(() => jest.clearAllMocks())

    it('G1 happy path: returns employee when role is ADMIN', async () => {
        mockVerify.mockReturnValue(validPayload)
        mockFindFirst.mockResolvedValue({ id: 10 })
        const out = await requireAdmin(makeReq('Bearer x'))
        expect(out.role).toBe('ADMIN')
    })

    it('G2 throws Forbidden when role is EMPLOYEE', async () => {
        mockVerify.mockReturnValue({ ...validPayload, role: 'EMPLOYEE' })
        mockFindFirst.mockResolvedValue({ id: 10 })
        await expect(requireAdmin(makeReq('Bearer x'))).rejects.toThrow(/Forbidden/)
    })

    it('G3 propagates underlying token errors before role check', async () => {
        await expect(requireAdmin(makeReq(null))).rejects.toThrow('Token no proporcionado')
    })
})
