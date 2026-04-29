/// <reference types="jest" />

// =====================================================================
// PRUEBAS DE ESCENARIOS INVÁLIDOS (deben pasar)
// ---------------------------------------------------------------------
// Verifican que el controlador de AUTH responde con los códigos HTTP
// y mensajes correctos cuando el cliente envía datos inválidos o el
// servicio rechaza una operación. Todas deben terminar en "passed".
// =====================================================================

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
  class NextRequest {}
  return { NextResponse, NextRequest }
})

jest.mock('../../services/auth.service', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  },
}))

jest.mock('@/lib/get-ip', () => ({ getIp: jest.fn() }))
jest.mock('@/lib/auth-guard', () => ({ getAuthEmployee: jest.fn() }))

import { authController } from '../auth.controller'
import { authService } from '../../services/auth.service'
import { getIp } from '@/lib/get-ip'
import { getAuthEmployee } from '@/lib/auth-guard'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ body, headers }: { body?: unknown; headers?: Record<string, string> } = {}): any {
  return {
    json: jest.fn().mockResolvedValue(body ?? {}),
    headers: { get: (k: string) => headers?.[k.toLowerCase()] ?? null },
  }
}

describe('authController.register — escenarios inválidos', () => {
  it('responde 400 cuando falta el email', async () => {
    mocked(authService.register).mockRejectedValue(new Error('El email es obligatorio'))
    const res: any = await authController.register(makeReq({ body: {} }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'El email es obligatorio' })
  })

  it('responde 400 cuando el email ya existe', async () => {
    mocked(authService.register).mockRejectedValue(new Error('Ya existe un usuario con ese email'))
    const res: any = await authController.register(makeReq({ body: {} }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Ya existe un usuario con ese email' })
  })

  it('responde 400 cuando el rol no existe en la BD', async () => {
    mocked(authService.register).mockRejectedValue(new Error('El rol no existe'))
    const res: any = await authController.register(makeReq({ body: {} }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'El rol no existe' })
  })
})

describe('authController.login — escenarios inválidos', () => {
  it('responde 400 cuando el servicio rechaza por campos faltantes (no emite cookie)', async () => {
    mocked(getIp).mockReturnValue('1.1.1.1')
    mocked(authService.login).mockRejectedValue(new Error('El email es obligatorio'))

    const res: any = await authController.login(makeReq({ body: {} }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'El email es obligatorio' })
    expect(res.cookies.set).not.toHaveBeenCalled()
  })

  it('responde 400 con "Credenciales inválidas" cuando la contraseña no coincide', async () => {
    mocked(getIp).mockReturnValue('1.1.1.1')
    mocked(authService.login).mockRejectedValue(new Error('Credenciales inválidas'))

    const res: any = await authController.login(
      makeReq({ body: { email: 'a@b.c', password: 'bad' } }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Credenciales inválidas' })
  })
})

describe('authController.logout — escenarios inválidos', () => {
  it('responde 401 cuando no se envía token (Token no proporcionado)', async () => {
    mocked(getAuthEmployee).mockImplementation(() => {
      throw new Error('Token no proporcionado')
    })

    const res: any = await authController.logout(makeReq())

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ message: 'Token no proporcionado' })
    expect(authService.logout).not.toHaveBeenCalled()
  })

  it('responde 401 cuando el token está expirado', async () => {
    mocked(getAuthEmployee).mockImplementation(() => {
      throw new Error('Token inválido o expirado')
    })

    const res: any = await authController.logout(makeReq())

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ message: 'Token inválido o expirado' })
  })

  it('responde 400 cuando el guard pasa pero el servicio falla por otra razón', async () => {
    mocked(getAuthEmployee).mockReturnValue({ id: 7, email: 'a@b.c', role: 'ADMIN' })
    mocked(authService.logout).mockRejectedValue(new Error('db connection lost'))

    const res: any = await authController.logout(makeReq())

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'db connection lost' })
  })
})
