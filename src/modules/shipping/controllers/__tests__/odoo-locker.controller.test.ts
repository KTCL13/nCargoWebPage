/// <reference types="jest" />

// =====================================================================
// Pruebas unitarias del OdooLockerController (/api/shipments)
//   GRUPO 1 — Happy path
//   GRUPO 2 — Errores de negocio controlados
//   GRUPO 3 — Sin token → 401 | rol incorrecto → 403
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

jest.mock('../../services/odoo-locker.service', () => ({
  odooLockerService: {
    syncFromOdoo: jest.fn(),
    getAllLockers: jest.fn(),
    getShipments: jest.fn(),
    updateShipment: jest.fn(),
    getShipmentsForLocker: jest.fn(),
    createShipment: jest.fn(),
  },
}))

jest.mock('@/lib/auth-guard', () => ({
  getAuthEmployee: jest.fn().mockReturnValue({ id: 1, email: 'emp@ncargo.com', role: 'EMPLOYEE' }),
  requireAdmin: jest.fn().mockReturnValue({ id: 1, email: 'adm@ncargo.com', role: 'ADMIN' }),
}))

import { odooLockerController } from '../odoo-locker.controller'
import { odooLockerService } from '../../services/odoo-locker.service'
import { getAuthEmployee, requireAdmin } from '@/lib/auth-guard'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ url = 'http://localhost/api/shipments', body }: { url?: string; body?: unknown } = {}): any {
  return {
    url,
    json: jest.fn().mockResolvedValue(body ?? {}),
    headers: { get: () => null },
  }
}

const noToken = () => { throw new Error('Token no proporcionado') }
const forbidden = () => { throw new Error('Forbidden: se requiere rol ADMIN') }

// =====================================================================
// GET /shipments — getShipments
// =====================================================================
describe('odooLockerController.getShipments (GET /api/shipments)', () => {
  const mockResult = { data: [{ id: 1 }], total: 1 }

  it('G1 happy path: retorna 200 con shipments paginados', async () => {
    mocked(odooLockerService.getShipments).mockResolvedValue(mockResult)

    const res: any = await odooLockerController.getShipments(
      makeReq({ url: 'http://localhost/api/shipments?page=1&pageSize=15' }),
    )

    expect(res.status).toBe(200)
    expect(odooLockerService.getShipments).toHaveBeenCalled()
  })

  it('G2 error de negocio: servicio falla → 400', async () => {
    mocked(odooLockerService.getShipments).mockRejectedValue(new Error('DB error'))

    const res: any = await odooLockerController.getShipments(makeReq())

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ message: 'DB error' })
  })

  it('G3 sin token → 401 (no 200, no 400)', async () => {
    mocked(getAuthEmployee).mockImplementationOnce(noToken)

    const res: any = await odooLockerController.getShipments(makeReq())

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ message: 'Token no proporcionado' })
  })
})

// =====================================================================
// PATCH /shipments — updateShipment
// =====================================================================
describe('odooLockerController.updateShipment (PATCH /api/shipments)', () => {
  const validBody = { id: 5, trackingNumber: 'TRK123', odooStageName: 'Entregado', comment: '' }

  it('G1 happy path: retorna 200 con shipment actualizado', async () => {
    const updated = { id: 5, trackingNumber: 'TRK123' }
    mocked(odooLockerService.updateShipment).mockResolvedValue(updated)

    const res: any = await odooLockerController.updateShipment(makeReq({ body: validBody }))

    expect(res.status).toBe(200)
    expect(odooLockerService.updateShipment).toHaveBeenCalledWith(5, 'TRK123', 'Entregado', '', 1)
  })

  it('G2 id ausente en body → 400 "id is required"', async () => {
    const res: any = await odooLockerController.updateShipment(
      makeReq({ body: { trackingNumber: 'TRK123' } }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ message: 'id is required' })
  })

  it('G3 sin token → 401', async () => {
    mocked(getAuthEmployee).mockImplementationOnce(noToken)

    const res: any = await odooLockerController.updateShipment(makeReq({ body: validBody }))

    expect(res.status).toBe(401)
  })
})

// =====================================================================
// POST /odoo/sync-lockers — syncLockers (solo ADMIN)
// =====================================================================
describe('odooLockerController.syncLockers (POST /api/odoo/sync-lockers)', () => {
  it('G1 happy path: retorna 200 con resultado de sync', async () => {
    const syncResult = { synced: 3, skipped: 0 }
    mocked(odooLockerService.syncFromOdoo).mockResolvedValue(syncResult)

    const res: any = await odooLockerController.syncLockers(
      makeReq({ body: { searchTerm: 'Casillero' } }),
    )

    expect(res.status).toBe(200)
    expect(odooLockerService.syncFromOdoo).toHaveBeenCalledWith('Casillero')
  })

  it('G2 sin token → 401', async () => {
    mocked(requireAdmin).mockImplementationOnce(noToken)

    const res: any = await odooLockerController.syncLockers(makeReq())

    expect(res.status).toBe(401)
  })

  it('G3 rol EMPLOYEE → 403', async () => {
    mocked(requireAdmin).mockImplementationOnce(forbidden)

    const res: any = await odooLockerController.syncLockers(makeReq())

    expect(res.status).toBe(403)
  })
})
