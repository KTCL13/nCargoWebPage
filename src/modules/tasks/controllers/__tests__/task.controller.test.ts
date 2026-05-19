/// <reference types="jest" />

// =====================================================================
// Pruebas unitarias del TaskController
//   GRUPO 1 — Happy path
//   GRUPO 2 — Errores de negocio controlados
//   GRUPO 3 — Casos inválidos que el sistema maneja (// caso inválido controlado)
// Nota: los endpoints de /tasks no usan getAuthEmployee, por lo que no hay
//       rama 401 implementada. Los errores "not found" se responden como 400.
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

jest.mock('../../services/task.service', () => ({
  taskService: {
    findById: jest.fn(),
    findAll: jest.fn(),
    assignTask: jest.fn(),
    reassignTask: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    bulkAssign: jest.fn(),
    markOverdueTasksAsNotDone: jest.fn(),
  },
}))

jest.mock('@/lib/auth-guard', () => ({
  getAuthEmployee: jest.fn().mockReturnValue({ id: 1, email: 'admin@ncargo.com', role: 'ADMIN' }),
  requireAdmin: jest.fn().mockReturnValue({ id: 1, email: 'admin@ncargo.com', role: 'ADMIN' }),
}))

import { taskController } from '../task.controller'
import { taskService } from '../../services/task.service'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ url = 'http://localhost/api/tasks', body }: { url?: string; body?: unknown } = {}): any {
  return {
    url,
    json: jest.fn().mockResolvedValue(body ?? {}),
    headers: { get: () => null },
  }
}

// =====================================================================
// GET /tasks?id=X — findById
// =====================================================================
describe('taskController.findById (GET /tasks?id=X)', () => {
  it('G1 happy path: retorna 200 con la tarea', async () => {
    const task = { id: 7, title: 'Task', status: 'PENDING' }
    mocked(taskService.findById).mockResolvedValue(task)

    const res: any = await taskController.findById(makeReq({ url: 'http://localhost/api/tasks?id=7' }))

    expect(res.status).toBe(200)
    expect(taskService.findById).toHaveBeenCalledWith(7)
  })

  it('G2 error de negocio: "Task not found with id X" → 400 con mensaje', async () => {
    mocked(taskService.findById).mockRejectedValue(new Error('Task not found with id 999'))

    const res: any = await taskController.findById(
      makeReq({ url: 'http://localhost/api/tasks?id=999' }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Task not found with id 999' })
  })

  it('G3 caso inválido controlado: id ausente → NaN, servicio lanza → 400 controlado', async () => {
    // caso inválido controlado
    mocked(taskService.findById).mockRejectedValue(new Error('Task not found with id NaN'))

    const res: any = await taskController.findById(makeReq())

    expect(res.status).toBe(400)
  })
})

// =====================================================================
// GET /tasks (list, paginated, con filtros) — findAll
// =====================================================================
describe('taskController.findAll (GET /tasks)', () => {
  it('G1 happy path: retorna 200 con paginación y reenvía filtros al servicio', async () => {
    const page = { data: [], total: 0, page: 2, limit: 5 }
    mocked(taskService.findAll).mockResolvedValue(page)

    const res: any = await taskController.findAll(
      makeReq({ url: 'http://localhost/api/tasks?page=2&limit=5&status=PENDING&employeeId=3' }),
    )

    expect(res.status).toBe(200)
    expect(taskService.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      status: 'PENDING',
      employeeId: 3,
    })
  })

  it('G2 error de negocio: servicio falla → 400', async () => {
    mocked(taskService.findAll).mockRejectedValue(new Error('DB error'))

    const res: any = await taskController.findAll(makeReq())

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'DB error' })
  })

  it('G3 caso inválido controlado: sin query params → defaults page=1, limit=10', async () => {
    // caso inválido controlado
    mocked(taskService.findAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })

    await taskController.findAll(makeReq())

    const call = mocked(taskService.findAll).mock.calls[0][0]
    expect(call.page).toBe(1)
    expect(call.limit).toBe(10)
  })
})

// =====================================================================
// POST /tasks?adminId=X — assignTask
// =====================================================================
describe('taskController.assignTask (POST /tasks?adminId=X)', () => {
  const validBody = { title: 'New Task', employeeId: 5 }

  it('G1 happy path: retorna 201 con la tarea creada', async () => {
    const created = { id: 10, title: 'New Task', status: 'PENDING' }
    mocked(taskService.assignTask).mockResolvedValue(created)

    const res: any = await taskController.assignTask(
      makeReq({ url: 'http://localhost/api/tasks?adminId=1', body: validBody }),
    )

    expect(res.status).toBe(201)
    expect(taskService.assignTask).toHaveBeenCalledWith(validBody, 1)
  })

  it('G2 error de negocio: adminId ausente → servicio lanza "adminId es requerido" → 400', async () => {
    mocked(taskService.assignTask).mockRejectedValue(new Error('adminId es requerido'))

    const res: any = await taskController.assignTask(makeReq({ body: validBody }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'adminId es requerido' })
  })

  it('G3 caso inválido controlado: endTime < startTime → servicio lanza, 400 controlado', async () => {
    // caso inválido controlado
    mocked(taskService.assignTask).mockRejectedValue(
      new Error('La fecha de fin no puede ser menor que la de inicio'),
    )

    const res: any = await taskController.assignTask(
      makeReq({
        url: 'http://localhost/api/tasks?adminId=1',
        body: { ...validBody, startTime: '2026-02-01', endTime: '2026-01-01' },
      }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      message: 'La fecha de fin no puede ser menor que la de inicio',
    })
  })
})

// =====================================================================
// PUT /tasks/reassign?id=X — reassignTask
// =====================================================================
describe('taskController.reassignTask (PUT /tasks/reassign?id=X)', () => {
  it('G1 happy path: retorna 200 con la tarea reasignada', async () => {
    const updated = { id: 5, employeeId: 9 }
    mocked(taskService.reassignTask).mockResolvedValue(updated)

    const res: any = await taskController.reassignTask(
      makeReq({ url: 'http://localhost/api/tasks/reassign?id=5', body: { newEmployeeId: 9 } }),
    )

    expect(res.status).toBe(200)
    expect(taskService.reassignTask).toHaveBeenCalledWith(5, { newEmployeeId: 9 }, 1)
  })

  it('G2 error de negocio: tarea no existe → 400 "Task no encontrada con id X"', async () => {
    mocked(taskService.reassignTask).mockRejectedValue(new Error('Task no encontrada con id 999'))

    const res: any = await taskController.reassignTask(
      makeReq({ url: 'http://localhost/api/tasks/reassign?id=999', body: { newEmployeeId: 9 } }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Task no encontrada con id 999' })
  })

  it('G3 caso inválido controlado: body vacío → servicio lanza, 400 controlado', async () => {
    // caso inválido controlado
    mocked(taskService.reassignTask).mockRejectedValue(new Error('Missing newEmployeeId'))

    const res: any = await taskController.reassignTask(
      makeReq({ url: 'http://localhost/api/tasks/reassign?id=5', body: {} }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Missing newEmployeeId' })
  })
})

// =====================================================================
// PUT /tasks?id=X — update
// =====================================================================
describe('taskController.update (PUT /tasks?id=X)', () => {
  it('G1 happy path: retorna 200 con tarea actualizada', async () => {
    const updated = { id: 3, title: 'Updated', status: 'COMPLETED' }
    mocked(taskService.update).mockResolvedValue(updated)

    const res: any = await taskController.update(
      makeReq({ url: 'http://localhost/api/tasks?id=3', body: { status: 'COMPLETED' } }),
    )

    expect(res.status).toBe(200)
    expect(taskService.update).toHaveBeenCalledWith(3, { status: 'COMPLETED', actorId: 1 })
  })

  it('G2 error de negocio: tarea no existe → 400', async () => {
    mocked(taskService.update).mockRejectedValue(new Error('Task no encontrada con id 999'))

    const res: any = await taskController.update(
      makeReq({ url: 'http://localhost/api/tasks?id=999', body: {} }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Task no encontrada con id 999' })
  })

  it('G3 caso inválido controlado: status inválido → servicio lanza, 400 controlado', async () => {
    // caso inválido controlado
    mocked(taskService.update).mockRejectedValue(
      new Error("TaskStatus 'INVALID' no existe en la tabla task_status"),
    )

    const res: any = await taskController.update(
      makeReq({
        url: 'http://localhost/api/tasks?id=3',
        body: { status: 'INVALID' as any },
      }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      message: "TaskStatus 'INVALID' no existe en la tabla task_status",
    })
  })
})

// =====================================================================
// DELETE /tasks?id=X — remove
// =====================================================================
describe('taskController.remove (DELETE /tasks?id=X)', () => {
  it('G1 happy path: retorna 204 sin body', async () => {
    mocked(taskService.delete).mockResolvedValue(undefined)

    const res: any = await taskController.remove(makeReq({ url: 'http://localhost/api/tasks?id=5' }))

    expect(res.status).toBe(204)
    expect(taskService.delete).toHaveBeenCalledWith(5)
  })

  it('G2 error de negocio: tarea no existe → 400', async () => {
    mocked(taskService.delete).mockRejectedValue(new Error('Task no encontrada con id 999'))

    const res: any = await taskController.remove(
      makeReq({ url: 'http://localhost/api/tasks?id=999' }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Task no encontrada con id 999' })
  })

  it('G3 caso inválido controlado: id="abc" → NaN, servicio lanza → 400 controlado', async () => {
    // caso inválido controlado
    mocked(taskService.delete).mockRejectedValue(new Error('Task no encontrada con id NaN'))

    const res: any = await taskController.remove(
      makeReq({ url: 'http://localhost/api/tasks?id=abc' }),
    )

    expect(res.status).toBe(400)
  })
})

// =====================================================================
// POST /tasks/bulk-assign?adminId=X — bulkAssign
// =====================================================================
describe('taskController.bulkAssign (POST /tasks/bulk-assign?adminId=X)', () => {
  const validBody = { title: 'Mass Task', employeeIds: [1, 2, 3] }

  it('G1 happy path: retorna 201 con array de tareas creadas', async () => {
    const tasks = [{ id: 1 }, { id: 2 }, { id: 3 }]
    mocked(taskService.bulkAssign).mockResolvedValue(tasks)

    const res: any = await taskController.bulkAssign(
      makeReq({ url: 'http://localhost/api/tasks/bulk-assign?adminId=1', body: validBody }),
    )

    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toEqual(tasks)
    expect(taskService.bulkAssign).toHaveBeenCalledWith(validBody, 1)
  })

  it('G2 error de negocio: servicio falla (foreign-key) → 400', async () => {
    mocked(taskService.bulkAssign).mockRejectedValue(new Error('Foreign key constraint failed'))

    const res: any = await taskController.bulkAssign(
      makeReq({ url: 'http://localhost/api/tasks/bulk-assign?adminId=1', body: validBody }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'Foreign key constraint failed' })
  })

  it('G3 caso inválido controlado: employeeIds=[] → el servicio resuelve con [], 201 sin crash', async () => {
    // caso inválido controlado
    mocked(taskService.bulkAssign).mockResolvedValue([])

    const res: any = await taskController.bulkAssign(
      makeReq({
        url: 'http://localhost/api/tasks/bulk-assign?adminId=1',
        body: { title: 'Mass Task', employeeIds: [] },
      }),
    )

    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toEqual([])
  })
})

// =====================================================================
// POST /tasks/check-overdue — checkOverdue
// =====================================================================
describe('taskController.checkOverdue (POST /tasks/check-overdue)', () => {
  it('G1 happy path: retorna 200 con mensaje "Overdue tasks processed"', async () => {
    mocked(taskService.markOverdueTasksAsNotDone).mockResolvedValue(undefined)

    const res: any = await taskController.checkOverdue(makeReq())

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ message: 'Overdue tasks processed' })
  })

  it('G2 error de negocio: servicio falla → 400 con mensaje', async () => {
    mocked(taskService.markOverdueTasksAsNotDone).mockRejectedValue(new Error('DB failure'))

    const res: any = await taskController.checkOverdue(makeReq())

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ message: 'DB failure' })
  })

  it('G3 caso inválido controlado: no hay tareas vencidas → servicio resuelve, 200 con mismo mensaje', async () => {
    // caso inválido controlado — el servicio retorna early si no hay tareas
    mocked(taskService.markOverdueTasksAsNotDone).mockResolvedValue(undefined)

    const res: any = await taskController.checkOverdue(makeReq())

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ message: 'Overdue tasks processed' })
  })
})
