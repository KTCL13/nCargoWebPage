/// <reference types="jest" />

// =====================================================================
// Pruebas unitarias del EmployeeController
// ---------------------------------------------------------------------
// Cubre los 9 endpoints con tres grupos por cada uno:
//   GRUPO 1 — Happy path (respuesta exitosa)
//   GRUPO 2 — Errores de negocio controlados (404/400 con mensaje)
//   GRUPO 3 — Casos inválidos que el sistema maneja con 400 controlado
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

jest.mock('../../services/employee.service', () => ({
  employeeService: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getContracts: jest.fn(),
    findContractById: jest.fn(),
    createContract: jest.fn(),
    updateContract: jest.fn(),
    assignRoles: jest.fn(),
  },
}))

import { employeeController } from '../employee.controller'
import { employeeService } from '../../services/employee.service'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ url = 'http://localhost/api/employees', body }: { url?: string; body?: unknown } = {}): any {
  return {
    url,
    json: jest.fn().mockResolvedValue(body ?? {}),
    headers: { get: () => null },
  }
}

// =====================================================================
// GET /employees — findAll
// =====================================================================
describe('employeeController.findAll (GET /employees)', () => {
  it('G1 happy path: retorna 200 con respuesta paginada', async () => {
    const payload = { data: [{ id: 1, name: 'A' }], total: 1, page: 1, limit: 10 }
    mocked(employeeService.findAll).mockResolvedValue(payload)

    const res: any = await employeeController.findAll(
      makeReq({ url: 'http://localhost/api/employees?page=1&limit=10&status=ACTIVE' }),
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual(payload)
    expect(employeeService.findAll).toHaveBeenCalledWith({
      status: 'ACTIVE',
      roleId: undefined,
      search: undefined,
      page: 1,
      limit: 10,
    })
  })

  it('G2 error de negocio: el servicio falla y responde 400 con mensaje', async () => {
    mocked(employeeService.findAll).mockRejectedValue(new Error('DB unavailable'))

    const res: any = await employeeController.findAll(makeReq())

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'DB unavailable' })
  })

  it('G3 caso inválido controlado: roleId no numérico → se pasa NaN al filtro, no explota', async () => {
    // caso inválido controlado
    mocked(employeeService.findAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })

    const res: any = await employeeController.findAll(
      makeReq({ url: 'http://localhost/api/employees?roleId=abc' }),
    )

    expect(res.status).toBe(200)
    const call = mocked(employeeService.findAll).mock.calls[0][0]
    expect(Number.isNaN(call.roleId)).toBe(true)
  })
})

// =====================================================================
// GET /employees?id=X — findOne
// =====================================================================
describe('employeeController.findOne (GET /employees?id=X)', () => {
  it('G1 happy path: retorna 200 con el empleado', async () => {
    const emp = { id: 7, name: 'Bob', email: 'b@c.d', status: 'ACTIVE', roles: [], activeContract: null, createdAt: new Date() }
    mocked(employeeService.findOne).mockResolvedValue(emp)

    const res: any = await employeeController.findOne(
      makeReq({ url: 'http://localhost/api/employees?id=7' }),
    )

    expect(res.status).toBe(200)
    expect(employeeService.findOne).toHaveBeenCalledWith(7)
  })

  it('G2 error de negocio: empleado no existe → 400 con mensaje "Employee not found with id X"', async () => {
    mocked(employeeService.findOne).mockRejectedValue(new Error('Employee not found with id 999'))

    const res: any = await employeeController.findOne(
      makeReq({ url: 'http://localhost/api/employees?id=999' }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Employee not found with id 999' })
  })

  it('G3 caso inválido controlado: id ausente → NaN, el servicio lanza y controller responde 400', async () => {
    // caso inválido controlado
    mocked(employeeService.findOne).mockRejectedValue(new Error('Employee not found with id NaN'))

    const res: any = await employeeController.findOne(makeReq({ url: 'http://localhost/api/employees' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toContain('Employee not found')
  })
})

// =====================================================================
// POST /employees — create
// =====================================================================
describe('employeeController.create (POST /employees)', () => {
  const validBody = { name: 'Alice', email: 'a@b.c', password: 'pw', status: 'ACTIVE', roleIds: [1] }

  it('G1 happy path: retorna 201 con el empleado creado', async () => {
    const created = { id: 10, name: 'Alice', email: 'a@b.c', status: 'ACTIVE', roles: ['ADMIN'], activeContract: null, createdAt: new Date() }
    mocked(employeeService.create).mockResolvedValue(created)

    const res: any = await employeeController.create(makeReq({ body: validBody }))

    expect(res.status).toBe(201)
    expect(employeeService.create).toHaveBeenCalledWith(validBody)
  })

  it('G2 error de negocio: email duplicado en BD → 400 con mensaje', async () => {
    mocked(employeeService.create).mockRejectedValue(new Error('Unique constraint failed on email'))

    const res: any = await employeeController.create(makeReq({ body: validBody }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Unique constraint failed on email' })
  })

  it('G3 caso inválido controlado: tipos de datos incorrectos → el servicio rechaza y controller responde 400', async () => {
    // caso inválido controlado
    mocked(employeeService.create).mockRejectedValue(new Error('Invalid value for field "status"'))

    const res: any = await employeeController.create(
      makeReq({ body: { ...validBody, status: 12345 as any } }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Invalid value for field "status"' })
  })
})

// =====================================================================
// PUT /employees?id=X — update
// =====================================================================
describe('employeeController.update (PUT /employees?id=X)', () => {
  it('G1 happy path: retorna 200 con el empleado actualizado', async () => {
    const updated = { id: 3, name: 'New Name', email: 'n@x.y', status: 'ACTIVE', roles: [], activeContract: null, createdAt: new Date() }
    mocked(employeeService.update).mockResolvedValue(updated)

    const res: any = await employeeController.update(
      makeReq({ url: 'http://localhost/api/employees?id=3', body: { name: 'New Name' } }),
    )

    expect(res.status).toBe(200)
    expect(employeeService.update).toHaveBeenCalledWith(3, { name: 'New Name' })
  })

  it('G2 error de negocio: id no existe → 400 con mensaje', async () => {
    mocked(employeeService.update).mockRejectedValue(new Error('Record to update not found'))

    const res: any = await employeeController.update(
      makeReq({ url: 'http://localhost/api/employees?id=999', body: {} }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Record to update not found' })
  })

  it('G3 caso inválido controlado: id ausente (NaN) → 400 controlado', async () => {
    // caso inválido controlado
    mocked(employeeService.update).mockRejectedValue(new Error('Invalid `id`'))

    const res: any = await employeeController.update(
      makeReq({ url: 'http://localhost/api/employees', body: {} }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Invalid `id`' })
  })
})

// =====================================================================
// DELETE /employees?id=X — remove (soft-delete)
// =====================================================================
describe('employeeController.remove (DELETE /employees?id=X)', () => {
  it('G1 happy path: retorna 204 sin body', async () => {
    mocked(employeeService.remove).mockResolvedValue(undefined)

    const res: any = await employeeController.remove(
      makeReq({ url: 'http://localhost/api/employees?id=5' }),
    )

    expect(res.status).toBe(204)
    expect(employeeService.remove).toHaveBeenCalledWith(5)
  })

  it('G2 error de negocio: id no existe → 400 con mensaje', async () => {
    mocked(employeeService.remove).mockRejectedValue(new Error('Employee not found'))

    const res: any = await employeeController.remove(
      makeReq({ url: 'http://localhost/api/employees?id=999' }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Employee not found' })
  })

  it('G3 caso inválido controlado: id="not-a-number" → NaN, servicio lanza → 400 controlado', async () => {
    // caso inválido controlado
    mocked(employeeService.remove).mockRejectedValue(new Error('Invalid `id`'))

    const res: any = await employeeController.remove(
      makeReq({ url: 'http://localhost/api/employees?id=not-a-number' }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Invalid `id`' })
  })
})

// =====================================================================
// GET /employees/contracts?employeeId=X — getContracts
// =====================================================================
describe('employeeController.getContracts (GET /employees/contracts)', () => {
  it('G1 happy path: retorna 200 con array de contratos', async () => {
    const contracts = [{ id: 1, salary: 5000, hourlyRate: 25, isActive: true }]
    mocked(employeeService.getContracts).mockResolvedValue(contracts)

    const res: any = await employeeController.getContracts(
      makeReq({ url: 'http://localhost/api/employees/contracts?employeeId=3' }),
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual(contracts)
    expect(employeeService.getContracts).toHaveBeenCalledWith(3)
  })

  it('G2 error de negocio: servicio lanza error de base de datos → 400', async () => {
    mocked(employeeService.getContracts).mockRejectedValue(new Error('Connection error'))

    const res: any = await employeeController.getContracts(
      makeReq({ url: 'http://localhost/api/employees/contracts?employeeId=3' }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Connection error' })
  })

  it('G3 caso inválido controlado: sin employeeId → NaN, servicio retorna [] → 200 con lista vacía', async () => {
    // caso inválido controlado
    mocked(employeeService.getContracts).mockResolvedValue([])

    const res: any = await employeeController.getContracts(
      makeReq({ url: 'http://localhost/api/employees/contracts' }),
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual([])
  })
})

// =====================================================================
// GET /employees/contracts?contractId=X — findContractById
// =====================================================================
describe('employeeController.findContractById (GET /employees/contracts?contractId=X)', () => {
  it('G1 happy path: retorna 200 con el contrato', async () => {
    const contract = { id: 5, salary: 7000, hourlyRate: 30, isActive: true }
    mocked(employeeService.findContractById).mockResolvedValue(contract)

    const res: any = await employeeController.findContractById(
      makeReq({ url: 'http://localhost/api/employees/contracts?contractId=5' }),
    )

    expect(res.status).toBe(200)
    expect(employeeService.findContractById).toHaveBeenCalledWith(5)
  })

  it('G2 error de negocio: contrato no existe → 400 "Contract not found with id X"', async () => {
    mocked(employeeService.findContractById).mockRejectedValue(new Error('Contract not found with id 999'))

    const res: any = await employeeController.findContractById(
      makeReq({ url: 'http://localhost/api/employees/contracts?contractId=999' }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Contract not found with id 999' })
  })

  it('G3 caso inválido controlado: contractId ausente → NaN, servicio lanza → 400 controlado', async () => {
    // caso inválido controlado
    mocked(employeeService.findContractById).mockRejectedValue(new Error('Contract not found with id NaN'))

    const res: any = await employeeController.findContractById(
      makeReq({ url: 'http://localhost/api/employees/contracts' }),
    )

    expect(res.status).toBe(400)
  })
})

// =====================================================================
// POST /employees/contracts?employeeId=X — createContract
// =====================================================================
describe('employeeController.createContract (POST /employees/contracts)', () => {
  const validBody = { jobId: 1, contractTypeId: 2, salary: 5000, hourlyRate: 25, startDate: '2026-01-01' }

  it('G1 happy path: retorna 201 con el contrato creado', async () => {
    const created = { id: 10, salary: 5000, hourlyRate: 25, isActive: true }
    mocked(employeeService.createContract).mockResolvedValue(created)

    const res: any = await employeeController.createContract(
      makeReq({ url: 'http://localhost/api/employees/contracts?employeeId=3', body: validBody }),
    )

    expect(res.status).toBe(201)
    expect(employeeService.createContract).toHaveBeenCalledWith(3, validBody)
  })

  it('G2 error de negocio: empleado no existe (foreign-key) → 400', async () => {
    mocked(employeeService.createContract).mockRejectedValue(new Error('Foreign key constraint failed'))

    const res: any = await employeeController.createContract(
      makeReq({ url: 'http://localhost/api/employees/contracts?employeeId=999', body: validBody }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Foreign key constraint failed' })
  })

  it('G3 caso inválido controlado: body con startDate inválida → servicio rechaza, controller responde 400', async () => {
    // caso inválido controlado
    mocked(employeeService.createContract).mockRejectedValue(new Error('Invalid date'))

    const res: any = await employeeController.createContract(
      makeReq({
        url: 'http://localhost/api/employees/contracts?employeeId=3',
        body: { ...validBody, startDate: 'not-a-date' },
      }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Invalid date' })
  })
})

// =====================================================================
// PUT /employees/contracts?contractId=X — updateContract
// =====================================================================
describe('employeeController.updateContract (PUT /employees/contracts?contractId=X)', () => {
  it('G1 happy path: retorna 200 con el contrato actualizado', async () => {
    const updated = { id: 7, salary: 8000, hourlyRate: 35, isActive: true }
    mocked(employeeService.updateContract).mockResolvedValue(updated)

    const res: any = await employeeController.updateContract(
      makeReq({ url: 'http://localhost/api/employees/contracts?contractId=7', body: { salary: 8000 } }),
    )

    expect(res.status).toBe(200)
    expect(employeeService.updateContract).toHaveBeenCalledWith(7, { salary: 8000 })
  })

  it('G2 error de negocio: contractId no existe → 400', async () => {
    mocked(employeeService.updateContract).mockRejectedValue(new Error('Record to update not found'))

    const res: any = await employeeController.updateContract(
      makeReq({ url: 'http://localhost/api/employees/contracts?contractId=999', body: {} }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Record to update not found' })
  })

  it('G3 caso inválido controlado: body con tipo incorrecto → 400 controlado', async () => {
    // caso inválido controlado
    mocked(employeeService.updateContract).mockRejectedValue(new Error('Invalid value for field "salary"'))

    const res: any = await employeeController.updateContract(
      makeReq({
        url: 'http://localhost/api/employees/contracts?contractId=7',
        body: { salary: 'cinco-mil' as any },
      }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Invalid value for field "salary"' })
  })
})
