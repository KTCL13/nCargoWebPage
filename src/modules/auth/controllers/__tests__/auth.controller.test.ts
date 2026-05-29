/// <reference types="jest" />

jest.mock('next/server', () => {
  class NextResponse extends Response {
    cookies = { set: jest.fn() }
    static json(body: unknown, init?: { status?: number }) {
      return new NextResponse(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { 'content-type': 'application/json' },
      })
    }
  }
  class NextRequest { }
  return { NextResponse, NextRequest }
})

jest.mock('../../services/auth.service', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  },
}))

jest.mock('@/lib/get-ip', () => ({
  getIp: jest.fn(),
}))

jest.mock('@/lib/auth-guard', () => ({
  getAuthEmployee: jest.fn(),
}))

import { authController } from '../auth.controller'
import { authService } from '../../services/auth.service'
import { getIp } from '@/lib/get-ip'
import { getAuthEmployee } from '@/lib/auth-guard'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

type FakeReq = {
  body?: unknown
  headers?: Record<string, string>
}

function makeReq({ body, headers }: FakeReq = {}): any {
  return {
    json: jest.fn().mockResolvedValue(body ?? {}),
    headers: {
      get: (k: string) => headers?.[k.toLowerCase()] ?? null,
    },
  }
}

describe('authController.register', () => {
  it('returns 201 with the service DTO on success', async () => {
    const dto = { accessToken: 'jwt', role: 'ADMIN', email: 'a@b.c', name: 'A' }
    mocked(authService.register).mockResolvedValue(dto)
    const req = makeReq({ body: { name: 'A', email: 'a@b.c', password: 'pw', role: 'ADMIN' } })

    const res: any = await authController.register(req)

    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toEqual(dto)
    expect(authService.register).toHaveBeenCalledWith({ name: 'A', email: 'a@b.c', password: 'pw', role: 'ADMIN' })
  })

  it('returns 400 with the error message when a field is missing', async () => {
    mocked(authService.register).mockRejectedValue(new Error('El email es obligatorio'))
    const res: any = await authController.register(makeReq({ body: {} }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'El email es obligatorio' })
  })

  it('returns 400 with the duplicate-email message', async () => {
    mocked(authService.register).mockRejectedValue(new Error('Ya existe un usuario con ese email'))
    const res: any = await authController.register(makeReq({ body: {} }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Ya existe un usuario con ese email' })
  })
})

describe('authController.login', () => {
  const dto = { accessToken: 'jwt-token', role: 'ADMIN', email: 'a@b.c', name: 'A' }

  it('returns 200 with DTO, sets auth cookie, and forwards ip+userAgent', async () => {
    mocked(getIp).mockReturnValue('1.1.1.1')
    mocked(authService.login).mockResolvedValue(dto)
    const req = makeReq({ body: { email: 'a@b.c', password: 'pw' }, headers: { 'user-agent': 'UA/1.0' } })

    const res: any = await authController.login(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual(dto)
    expect(authService.login).toHaveBeenCalledWith({ email: 'a@b.c', password: 'pw' }, '1.1.1.1', 'UA/1.0')
    expect(res.cookies.set).toHaveBeenCalledWith(
      'token',
      'jwt-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      }),
    )
  })

  it('passes userAgent=undefined when header is absent', async () => {
    mocked(getIp).mockReturnValue('2.2.2.2')
    mocked(authService.login).mockResolvedValue(dto)
    const req = makeReq({ body: { email: 'a@b.c', password: 'pw' } })

    await authController.login(req)

    expect(authService.login).toHaveBeenCalledWith({ email: 'a@b.c', password: 'pw' }, '2.2.2.2', undefined)
  })

  it('returns 400 with service validation error and does not set cookie', async () => {
    mocked(getIp).mockReturnValue('1.1.1.1')
    mocked(authService.login).mockRejectedValue(new Error('El email es obligatorio'))
    const req = makeReq({ body: {} })

    const res: any = await authController.login(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'El email es obligatorio' })
    expect(res.cookies.set).not.toHaveBeenCalled()
  })

  it('returns 401 with "Credenciales inválidas" on bad credentials', async () => {
    mocked(getIp).mockReturnValue('1.1.1.1')
    mocked(authService.login).mockRejectedValue(new Error('Credenciales inválidas'))

    const res: any = await authController.login(makeReq({ body: { email: 'a@b.c', password: 'bad' } }))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ message: 'Credenciales inválidas' })
  })
})

describe('authController.logout', () => {
  it('returns 204 on successful logout', async () => {
    mocked(getAuthEmployee).mockResolvedValue({ id: 7, email: 'a@b.c', role: 'ADMIN', jti: 'test-jti' })
    mocked(authService.logout).mockResolvedValue(undefined)

    const res: any = await authController.logout(makeReq())

    expect(res.status).toBe(204)
    expect(authService.logout).toHaveBeenCalledWith(7, expect.any(String), expect.any(String))
  })

  it('returns 401 when token is invalid', async () => {
    mocked(getAuthEmployee).mockImplementation(() => {
      throw new Error('Token inválido o expirado')
    })

    const res: any = await authController.logout(makeReq())

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ message: 'Token inválido o expirado' })
    expect(authService.logout).not.toHaveBeenCalled()
  })

  it('returns 401 when token is missing', async () => {
    mocked(getAuthEmployee).mockImplementation(() => {
      throw new Error('Token no proporcionado')
    })

    const res: any = await authController.logout(makeReq())

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ message: 'Token no proporcionado' })
  })

  it('returns 400 when a non-token error occurs after auth', async () => {
    mocked(getAuthEmployee).mockResolvedValue({ id: 7, email: 'a@b.c', role: 'ADMIN', jti: 'test-jti' })
    mocked(authService.logout).mockRejectedValue(new Error('db down'))

    const res: any = await authController.logout(makeReq())

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'db down' })
  })
})
