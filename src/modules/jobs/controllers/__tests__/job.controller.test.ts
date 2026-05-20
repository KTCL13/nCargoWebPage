/// <reference types="jest" />

// =====================================================================
// Pruebas unitarias del JobController
//   GRUPO 1 — Happy path
//   GRUPO 2 — Errores de negocio controlados
//   GRUPO 3 — Casos inválidos que el sistema maneja (// caso inválido controlado)
// Nota: los endpoints de /jobs no usan getAuthEmployee, por lo que no hay
//       rama 401 implementada. Los errores "not found" se responden como
//       400 (el controller no distingue 404 en este código).
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

jest.mock('../../services/job.service', () => ({
  jobService: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}))

jest.mock('@/lib/auth-guard', () => ({
  requireAdmin: jest.fn().mockReturnValue({ id: 1, email: 'admin@ncargo.com', role: 'ADMIN' }),
}))

import { jobController } from '../job.controller'
import { jobService } from '../../services/job.service'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ url = 'http://localhost/api/jobs', body }: { url?: string; body?: unknown } = {}): any {
  return {
    url,
    json: jest.fn().mockResolvedValue(body ?? {}),
    headers: { get: () => null },
  }
}

// =====================================================================
// GET /jobs — findAll
// =====================================================================
describe('jobController.findAll (GET /jobs)', () => {
  it('G1 happy path: retorna 200 con la lista de jobs', async () => {
    const jobs = [{ id: 1, title: 'Dev', description: null }]
    mocked(jobService.findAll).mockResolvedValue(jobs)

    const res: any = await jobController.findAll(makeReq())

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual(jobs)
  })

  it('G2 error de negocio: servicio lanza → 400 con mensaje', async () => {
    mocked(jobService.findAll).mockRejectedValue(new Error('DB unavailable'))

    const res: any = await jobController.findAll(makeReq())

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'DB unavailable' })
  })

  it('G3 caso inválido controlado: lista vacía → 200 con []', async () => {
    // caso inválido controlado
    mocked(jobService.findAll).mockResolvedValue([])

    const res: any = await jobController.findAll(makeReq())

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual([])
  })
})

// =====================================================================
// GET /jobs?id=X — findOne
// =====================================================================
describe('jobController.findOne (GET /jobs?id=X)', () => {
  it('G1 happy path: retorna 200 con el job', async () => {
    const job = { id: 7, title: 'Dev', description: 'senior' }
    mocked(jobService.findOne).mockResolvedValue(job)

    const res: any = await jobController.findOne(makeReq({ url: 'http://localhost/api/jobs?id=7' }))

    expect(res.status).toBe(200)
    expect(jobService.findOne).toHaveBeenCalledWith(7)
  })

  it('G2 error de negocio: "Job not found with id X" → 400 con mensaje', async () => {
    mocked(jobService.findOne).mockRejectedValue(new Error('Job not found with id 999'))

    const res: any = await jobController.findOne(makeReq({ url: 'http://localhost/api/jobs?id=999' }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Job not found with id 999' })
  })

  it('G3 caso inválido controlado: id ausente → NaN, servicio lanza → 400 controlado', async () => {
    // caso inválido controlado
    mocked(jobService.findOne).mockRejectedValue(new Error('Job not found with id NaN'))

    const res: any = await jobController.findOne(makeReq({ url: 'http://localhost/api/jobs' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toContain('Job not found')
  })
})

// =====================================================================
// POST /jobs — create
// =====================================================================
describe('jobController.create (POST /jobs)', () => {
  const validBody = { title: 'Engineer', description: 'senior role' }

  it('G1 happy path: retorna 201 con el job creado', async () => {
    const created = { id: 10, ...validBody }
    mocked(jobService.create).mockResolvedValue(created)

    const res: any = await jobController.create(makeReq({ body: validBody }))

    expect(res.status).toBe(201)
    expect(jobService.create).toHaveBeenCalledWith(validBody)
  })

  it('G2 error de negocio: servicio rechaza (título duplicado) → 400', async () => {
    mocked(jobService.create).mockRejectedValue(new Error('Unique constraint failed on title'))

    const res: any = await jobController.create(makeReq({ body: validBody }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Unique constraint failed on title' })
  })

  it('G3 caso inválido controlado: tipo incorrecto (title numérico) → servicio lanza, 400 controlado', async () => {
    // caso inválido controlado
    mocked(jobService.create).mockRejectedValue(new Error('Invalid value for field "title"'))

    const res: any = await jobController.create(makeReq({ body: { title: 123 as any } }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Invalid value for field "title"' })
  })
})

// =====================================================================
// PUT /jobs?id=X — update
// =====================================================================
describe('jobController.update (PUT /jobs?id=X)', () => {
  it('G1 happy path: retorna 200 con el job actualizado', async () => {
    const updated = { id: 3, title: 'New', description: null }
    mocked(jobService.update).mockResolvedValue(updated)

    const res: any = await jobController.update(
      makeReq({ url: 'http://localhost/api/jobs?id=3', body: { title: 'New' } }),
    )

    expect(res.status).toBe(200)
    expect(jobService.update).toHaveBeenCalledWith(3, { title: 'New' })
  })

  it('G2 error de negocio: id no existe → 400 con mensaje', async () => {
    mocked(jobService.update).mockRejectedValue(new Error('Record to update not found'))

    const res: any = await jobController.update(
      makeReq({ url: 'http://localhost/api/jobs?id=999', body: {} }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Record to update not found' })
  })

  it('G3 caso inválido controlado: body vacío {} → el servicio no crashea', async () => {
    // caso inválido controlado
    mocked(jobService.update).mockResolvedValue({ id: 3, title: 'same', description: null })

    const res: any = await jobController.update(
      makeReq({ url: 'http://localhost/api/jobs?id=3', body: {} }),
    )

    expect(res.status).toBe(200)
    expect(jobService.update).toHaveBeenCalledWith(3, {})
  })
})

// =====================================================================
// DELETE /jobs?id=X — remove
// =====================================================================
describe('jobController.remove (DELETE /jobs?id=X)', () => {
  it('G1 happy path: retorna 204 sin body', async () => {
    mocked(jobService.remove).mockResolvedValue(undefined)

    const res: any = await jobController.remove(makeReq({ url: 'http://localhost/api/jobs?id=5' }))

    expect(res.status).toBe(204)
    expect(jobService.remove).toHaveBeenCalledWith(5)
  })

  it('G2 error de negocio: id no existe → 400 con mensaje', async () => {
    mocked(jobService.remove).mockRejectedValue(new Error('Record to delete not found'))

    const res: any = await jobController.remove(
      makeReq({ url: 'http://localhost/api/jobs?id=999' }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Record to delete not found' })
  })

  it('G3 caso inválido controlado: id="abc" → NaN, servicio lanza → 400 controlado', async () => {
    // caso inválido controlado
    mocked(jobService.remove).mockRejectedValue(new Error('Invalid `id`'))

    const res: any = await jobController.remove(
      makeReq({ url: 'http://localhost/api/jobs?id=abc' }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Invalid `id`' })
  })
})
