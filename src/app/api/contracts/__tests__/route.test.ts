/// <reference types="jest" />

// =====================================================================
// Route handler tests for /api/contracts
// After front2 refactor it delegates to contractsService and uses Zod.
// secfix added requireAdmin.
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

jest.mock('@/modules/services/contracts.service', () => ({
  contractsService: {
    findAll: jest.fn(),
    update: jest.fn(),
  },
}))

jest.mock('@/lib/auth-guard', () => ({
  requireAdmin: jest.fn(),
}))

import { GET, PUT } from '../route'
import { contractsService } from '@/modules/services/contracts.service'
import { requireAdmin } from '@/lib/auth-guard'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ url = 'http://localhost/api/contracts', body }: { url?: string; body?: unknown } = {}): any {
  return {
    url,
    json: jest.fn().mockResolvedValue(body ?? {}),
    headers: { get: () => null },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mocked(requireAdmin).mockReturnValue({ id: 1, email: 'a@x', role: 'ADMIN' })
})

describe('GET /api/contracts', () => {
  it('G1 happy path: admin forwards page/limit/search to contractsService', async () => {
    mocked(contractsService.findAll).mockResolvedValue({ data: [], total: 0 })

    const res: any = await GET(makeReq({ url: 'http://localhost/api/contracts?page=2&limit=5&search=ana' }))

    expect(res.status).toBe(200)
    expect(contractsService.findAll).toHaveBeenCalledWith(2, 5, 'ana')
  })

  it('G2 defaults: page=1, limit=10, search=""', async () => {
    mocked(contractsService.findAll).mockResolvedValue({ data: [], total: 0 })
    await GET(makeReq())
    expect(contractsService.findAll).toHaveBeenCalledWith(1, 10, '')
  })

  it('G3 non-admin → 403', async () => {
    mocked(requireAdmin).mockImplementationOnce(() => {
      throw new Error('Forbidden: se requiere rol ADMIN')
    })
    const res: any = await GET(makeReq())
    expect(res.status).toBe(403)
    expect(contractsService.findAll).not.toHaveBeenCalled()
  })

  it('G4 missing token → 401', async () => {
    mocked(requireAdmin).mockImplementationOnce(() => {
      throw new Error('Token no proporcionado')
    })
    const res: any = await GET(makeReq())
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/contracts?id=X', () => {
  it('G1 happy path: validates and delegates update', async () => {
    mocked(contractsService.update).mockResolvedValue({ id: 7, salary: 9000 })
    const res: any = await PUT(makeReq({ url: 'http://localhost/api/contracts?id=7', body: { salary: 9000 } }))
    expect(res.status).toBe(200)
    expect(contractsService.update).toHaveBeenCalledWith(7, { salary: 9000 })
  })

  it('G2 missing id → 400', async () => {
    const res: any = await PUT(makeReq({ body: { salary: 9000 } }))
    expect(res.status).toBe(400)
    expect(contractsService.update).not.toHaveBeenCalled()
  })

  it('G3 ZodError on invalid body → 400 with first issue message', async () => {
    const res: any = await PUT(makeReq({ url: 'http://localhost/api/contracts?id=7', body: { salary: 'not-a-number' } }))
    expect(res.status).toBe(400)
    expect(contractsService.update).not.toHaveBeenCalled()
  })

  it('G4 service throws not-found → 400', async () => {
    mocked(contractsService.update).mockRejectedValue(new Error('Record to update not found'))
    const res: any = await PUT(makeReq({ url: 'http://localhost/api/contracts?id=99', body: { salary: 5000 } }))
    expect(res.status).toBe(400)
  })

  it('G5 non-admin → 403', async () => {
    mocked(requireAdmin).mockImplementationOnce(() => {
      throw new Error('Forbidden: se requiere rol ADMIN')
    })
    const res: any = await PUT(makeReq({ url: 'http://localhost/api/contracts?id=7', body: { salary: 9000 } }))
    expect(res.status).toBe(403)
    expect(contractsService.update).not.toHaveBeenCalled()
  })
})
