/// <reference types="jest" />

// =====================================================================
// Pruebas unitarias del route handler global /api/contracts
// ---------------------------------------------------------------------
// Este handler usa prisma directamente (no controlador/servicio).
//   GET  /contracts       → lista paginada con búsqueda opcional
//   PUT  /contracts?id=X  → actualiza campos permitidos del contrato
// Cada método se cubre con los 3 grupos estándar.
// =====================================================================

jest.mock('next/server', () => {
  class NextResponse extends Response {
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

jest.mock('@/lib/prisma', () => ({
  prisma: {
    contract: {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { GET, PUT } from '../route'
import { prisma } from '@/lib/prisma'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ url = 'http://localhost/api/contracts', body }: { url?: string; body?: unknown } = {}): any {
  return {
    url,
    json: jest.fn().mockResolvedValue(body ?? {}),
    headers: { get: () => null },
  }
}

// =====================================================================
// GET /contracts
// =====================================================================
describe('GET /api/contracts', () => {
  it('G1 happy path: sin filtros retorna paginación con defaults', async () => {
    const rawContracts = [{ id: 1, salary: 5000, employee: { id: 1, firstName: 'Ana', lastName: 'García' }, job: { id: 1, title: 'Dev' } }]
    const mappedContracts = [{ id: 1, salary: 5000, employee: { id: 1, firstName: 'Ana', lastName: 'García', name: 'Ana García' }, job: { id: 1, title: 'Dev' } }]
    mocked((prisma as any).contract.findMany).mockResolvedValue(rawContracts)
    mocked((prisma as any).contract.count).mockResolvedValue(1)

    const res: any = await GET(makeReq())

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: mappedContracts, total: 1, page: 1, limit: 10 })
    expect((prisma as any).contract.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, skip: 0, take: 10 }),
    )
  })

  it('G2 con búsqueda: construye where con OR insensitive sobre employee.name y job.title', async () => {
    mocked((prisma as any).contract.findMany).mockResolvedValue([])
    mocked((prisma as any).contract.count).mockResolvedValue(0)

    await GET(makeReq({ url: 'http://localhost/api/contracts?search=Juan&page=2&limit=5' }))

    const call = mocked((prisma as any).contract.findMany).mock.calls[0][0]
    expect(call.where).toEqual({
      OR: [
        { employee: { firstName: { contains: 'Juan', mode: 'insensitive' } } },
        { employee: { lastName: { contains: 'Juan', mode: 'insensitive' } } },
        { job: { title: { contains: 'Juan', mode: 'insensitive' } } },
      ],
    })
    expect(call.skip).toBe(5)
    expect(call.take).toBe(5)
  })

  it('G3 caso inválido controlado: page=0 se normaliza a 1 gracias a Math.max', async () => {
    // caso inválido controlado
    mocked((prisma as any).contract.findMany).mockResolvedValue([])
    mocked((prisma as any).contract.count).mockResolvedValue(0)

    const res: any = await GET(makeReq({ url: 'http://localhost/api/contracts?page=0&limit=-5' }))

    const body = await res.json()
    expect(body.page).toBe(1)
    expect(body.limit).toBe(1)
    const call = mocked((prisma as any).contract.findMany).mock.calls[0][0]
    expect(call.skip).toBe(0)
    expect(call.take).toBe(1)
  })
})

// =====================================================================
// PUT /contracts?id=X
// =====================================================================
describe('PUT /api/contracts?id=X', () => {
  it('G1 happy path: retorna 200 con el contrato actualizado y pasa solo campos presentes a prisma.update', async () => {
    const rawUpdated = { id: 7, salary: 8000, hourlyRate: 35, isActive: true, employee: { id: 1, firstName: 'Ana', lastName: 'García' }, job: { id: 1, title: 'Dev' }, contractType: { id: 1, name: 'MENSUAL' } }
    const mappedUpdated = { ...rawUpdated, employee: { id: 1, firstName: 'Ana', lastName: 'García', name: 'Ana García' } }
    mocked((prisma as any).contract.update).mockResolvedValue(rawUpdated)

    const res: any = await PUT(
      makeReq({ url: 'http://localhost/api/contracts?id=7', body: { salary: 8000, hourlyRate: 35 } }),
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual(mappedUpdated)
    const call = mocked((prisma as any).contract.update).mock.calls[0][0]
    expect(call.where).toEqual({ id: 7 })
    expect(call.data).toEqual({ salary: 8000, hourlyRate: 35 })
  })

  it('G2 error de negocio: prisma.update lanza "Record to update not found" → 400 con mensaje', async () => {
    mocked((prisma as any).contract.update).mockRejectedValue(new Error('Record to update not found'))

    const res: any = await PUT(
      makeReq({ url: 'http://localhost/api/contracts?id=999', body: { salary: 1 } }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Record to update not found' })
  })

  it('G3 caso inválido controlado: body con campos desconocidos (foo) → se ignoran por el spread condicional', async () => {
    // caso inválido controlado
    const updated = { id: 7 }
    mocked((prisma as any).contract.update).mockResolvedValue(updated)

    await PUT(
      makeReq({
        url: 'http://localhost/api/contracts?id=7',
        body: { foo: 'bar', baz: 123, salary: 9000 },
      }),
    )

    const call = mocked((prisma as any).contract.update).mock.calls[0][0]
    // foo y baz nunca se pasan al payload de prisma
    expect(call.data).toEqual({ salary: 9000 })
    expect(call.data).not.toHaveProperty('foo')
    expect(call.data).not.toHaveProperty('baz')
  })
})
