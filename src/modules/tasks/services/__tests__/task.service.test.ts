/// <reference types="jest" />

// =====================================================================
// Pruebas unitarias del TaskService
// =====================================================================

jest.mock('../../notifications', () => ({}))

jest.mock('../../repositories/task.repository', () => ({
  taskRepository: {
    findAll: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    findOverduePending: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))

jest.mock('../../repositories/taskStatus.repository', () => ({
  taskStatusRepository: {
    findByName: jest.fn(),
    findById: jest.fn(),
  },
}))

jest.mock('@/modules/employees/repositories/employee.repository', () => ({
  employeeRepository: {
    getEmployeeById: jest.fn(),
  },
}))

jest.mock('@/modules/attendance/repositories/attendance.repository', () => ({
  attendanceRepository: {
    findActiveByEmployee: jest.fn(),
  },
}))

jest.mock('../../notifications/event-bus', () => ({
  eventBus: {
    publish: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/lib/audit-logger', () => ({
  auditLog: jest.fn().mockResolvedValue(undefined),
}))

import { taskService } from '../task.service'
import { taskRepository } from '../../repositories/task.repository'
import { taskStatusRepository } from '../../repositories/taskStatus.repository'
import { employeeRepository } from '@/modules/employees/repositories/employee.repository'
import { eventBus } from '../../notifications/event-bus'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

const pendingStatus = { id: 1, name: 'PENDING' }
const notDoneStatus = { id: 5, name: 'NOT_DONE' }
const fakeTask = {
  id: 10,
  title: 'Task',
  description: 'desc',
  employeeId: 3,
  createdBy: 1,
  assignedBy: 1,
  statusId: 1,
  startTime: null,
  endTime: null,
  minutesSpent: null,
  metadata: null,
  createdAt: new Date('2026-01-01'),
  attendanceId: null,
}

function primeStatusMocks() {
  mocked(taskStatusRepository.findByName).mockImplementation((name: any) => {
    if (name === 'PENDING') return Promise.resolve(pendingStatus)
    if (name === 'NOT_DONE') return Promise.resolve(notDoneStatus)
    return Promise.resolve({ id: 99, name })
  })
  mocked(taskStatusRepository.findById).mockResolvedValue(pendingStatus)
}

// =====================================================================
// findById
// =====================================================================
describe('taskService.findById', () => {
  it('G1 happy path: retorna DTO de la tarea', async () => {
    primeStatusMocks()
    mocked(taskRepository.findById).mockResolvedValue(fakeTask)

    const result = await taskService.findById(10)

    expect(taskRepository.findById).toHaveBeenCalledWith(10)
    expect(result.id).toBe(10)
    expect(result.status).toBe('PENDING')
  })

  it('G2 error de negocio: tarea no existe → lanza "Task not found with id X"', async () => {
    mocked(taskRepository.findById).mockResolvedValue(null)

    await expect(taskService.findById(999)).rejects.toThrow('Task not found with id 999')
  })

  it('G3 caso inválido controlado: id=NaN → repo retorna null → mismo error', async () => {
    // caso inválido controlado
    mocked(taskRepository.findById).mockResolvedValue(null)

    await expect(taskService.findById(NaN)).rejects.toThrow('Task not found with id NaN')
  })
})

// =====================================================================
// findAll
// =====================================================================
describe('taskService.findAll', () => {
  it('G1 happy path: retorna paginación con DTOs mapeados', async () => {
    primeStatusMocks()
    mocked(taskRepository.findAll).mockResolvedValue([fakeTask])
    mocked(taskRepository.count).mockResolvedValue(1)

    const result = await taskService.findAll({ page: 1, limit: 10 })

    expect(result.total).toBe(1)
    expect(result.data).toHaveLength(1)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
  })

  it('G2 error de negocio: repo lanza → propaga', async () => {
    mocked(taskRepository.findAll).mockRejectedValue(new Error('DB error'))

    await expect(taskService.findAll({})).rejects.toThrow('DB error')
  })

  it('G3 caso inválido controlado: filter vacío {} → usa defaults', async () => {
    // caso inválido controlado
    primeStatusMocks()
    mocked(taskRepository.findAll).mockResolvedValue([])
    mocked(taskRepository.count).mockResolvedValue(0)

    const result = await taskService.findAll({})

    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
    expect(result.data).toEqual([])
  })
})

// =====================================================================
// assignTask
// =====================================================================
describe('taskService.assignTask', () => {
  const dto = { title: 'New task', employeeId: 3 }

  it('G1 happy path: crea tarea, publica evento task.assigned y retorna DTO', async () => {
    primeStatusMocks()
    mocked(taskRepository.create).mockResolvedValue(fakeTask)
    mocked(employeeRepository.getEmployeeById).mockResolvedValue({ id: 3, name: 'Bob', email: 'b@x.y' })

    const result = await taskService.assignTask(dto, 1)

    expect(taskRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New task',
        employeeId: 3,
        createdBy: 1,
        assignedBy: 1,
        statusId: 1,
      }),
    )
    expect(eventBus.publish).toHaveBeenCalledWith('task.assigned', expect.any(Object))
    expect(result.id).toBe(10)
  })

  it('G2 error de negocio: adminId faltante (0) → lanza "adminId es requerido"', async () => {
    await expect(taskService.assignTask(dto, 0)).rejects.toThrow('adminId es requerido')
    expect(taskRepository.create).not.toHaveBeenCalled()
  })

  it('G3 caso inválido controlado: endTime < startTime → lanza "La fecha de fin no puede ser menor que la de inicio"', async () => {
    // caso inválido controlado
    await expect(
      taskService.assignTask(
        { ...dto, startTime: '2026-02-01', endTime: '2026-01-01' },
        1,
      ),
    ).rejects.toThrow('La fecha de fin no puede ser menor que la de inicio')
    expect(taskRepository.create).not.toHaveBeenCalled()
  })
})

// =====================================================================
// reassignTask
// =====================================================================
describe('taskService.reassignTask', () => {
  it('G1 happy path: actualiza tarea, publica task.reassigned y retorna DTO', async () => {
    primeStatusMocks()
    mocked(taskRepository.findById).mockResolvedValue(fakeTask)
    mocked(taskRepository.update).mockResolvedValue({ ...fakeTask, employeeId: 7 })
    mocked(employeeRepository.getEmployeeById).mockResolvedValue({ id: 7, name: 'Carol', email: 'c@x.y' })

    const result = await taskService.reassignTask(10, { newEmployeeId: 7 }, 1)

    expect(taskRepository.update).toHaveBeenCalledWith(10, {
      employee: { connect: { id: 7 } },
    })
    expect(eventBus.publish).toHaveBeenCalledWith('task.reassigned', expect.any(Object))
    expect(result.id).toBe(10)
  })

  it('G2 error de negocio: tarea no existe → lanza "Task no encontrada con id X"', async () => {
    mocked(taskRepository.findById).mockResolvedValue(null)

    await expect(taskService.reassignTask(999, { newEmployeeId: 7 }, 1)).rejects.toThrow(
      'Task no encontrada con id 999',
    )
  })

  it('G3 caso inválido controlado: nuevo empleado no existe en BD → no crashea, no publica evento', async () => {
    // caso inválido controlado — el servicio solo publica si el employee existe
    primeStatusMocks()
    mocked(taskRepository.findById).mockResolvedValue(fakeTask)
    mocked(taskRepository.update).mockResolvedValue(fakeTask)
    mocked(employeeRepository.getEmployeeById).mockResolvedValue(null)

    await taskService.reassignTask(10, { newEmployeeId: 999 }, 1)

    expect(eventBus.publish).not.toHaveBeenCalledWith('task.reassigned', expect.anything())
  })
})

// =====================================================================
// update
// =====================================================================
describe('taskService.update', () => {
  it('G1 happy path: actualiza campos simples y retorna DTO', async () => {
    primeStatusMocks()
    mocked(taskRepository.findById).mockResolvedValue(fakeTask)
    mocked(taskRepository.update).mockResolvedValue({ ...fakeTask, title: 'Updated' })

    const result = await taskService.update(10, { title: 'Updated' })

    expect(taskRepository.update).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ title: 'Updated' }),
    )
    expect(result.id).toBe(10)
  })

  it('G2 error de negocio: tarea no existe → lanza "Task no encontrada con id X"', async () => {
    mocked(taskRepository.findById).mockResolvedValue(null)

    await expect(taskService.update(999, { title: 'x' })).rejects.toThrow(
      'Task no encontrada con id 999',
    )
  })

  it('G3 caso inválido controlado: body vacío {} → no crashea, repo no recibe campos', async () => {
    // caso inválido controlado
    primeStatusMocks()
    mocked(taskRepository.findById).mockResolvedValue(fakeTask)
    mocked(taskRepository.update).mockResolvedValue(fakeTask)

    await taskService.update(10, {})

    const call = mocked(taskRepository.update).mock.calls[0][1]
    expect(call).toEqual({})
  })
})

// =====================================================================
// delete
// =====================================================================
describe('taskService.delete', () => {
  it('G1 happy path: verifica existencia y elimina', async () => {
    mocked(taskRepository.findById).mockResolvedValue(fakeTask)
    mocked(taskRepository.delete).mockResolvedValue(fakeTask)

    await taskService.delete(10)

    expect(taskRepository.findById).toHaveBeenCalledWith(10)
    expect(taskRepository.delete).toHaveBeenCalledWith(10)
  })

  it('G2 error de negocio: tarea no existe → lanza "Task no encontrada con id X"', async () => {
    mocked(taskRepository.findById).mockResolvedValue(null)

    await expect(taskService.delete(999)).rejects.toThrow('Task no encontrada con id 999')
    expect(taskRepository.delete).not.toHaveBeenCalled()
  })

  it('G3 caso inválido controlado: id=NaN → no existe, lanza el mismo error sin llamar delete', async () => {
    // caso inválido controlado
    mocked(taskRepository.findById).mockResolvedValue(null)

    await expect(taskService.delete(NaN)).rejects.toThrow('Task no encontrada con id NaN')
    expect(taskRepository.delete).not.toHaveBeenCalled()
  })
})

// =====================================================================
// bulkAssign
// =====================================================================
describe('taskService.bulkAssign', () => {
  const dto = { title: 'Mass', employeeIds: [3, 7] }

  it('G1 happy path: crea N tareas y publica evento por cada empleado existente', async () => {
    primeStatusMocks()
    mocked(taskRepository.create).mockResolvedValue(fakeTask)
    mocked(employeeRepository.getEmployeeById).mockResolvedValue({ id: 3, name: 'x', email: 'x@y.z' })

    const result = await taskService.bulkAssign(dto, 1)

    expect(taskRepository.create).toHaveBeenCalledTimes(2)
    expect(result).toHaveLength(2)
    expect(eventBus.publish).toHaveBeenCalledWith('task.assigned', expect.any(Object))
  })

  it('G2 error de negocio: si un create falla, Promise.all rechaza y propaga', async () => {
    primeStatusMocks()
    mocked(taskRepository.create)
      .mockResolvedValueOnce(fakeTask)
      .mockRejectedValueOnce(new Error('Foreign key constraint failed'))

    await expect(taskService.bulkAssign(dto, 1)).rejects.toThrow('Foreign key constraint failed')
  })

  it('G3 caso inválido controlado: employeeIds=[] → no crea tareas, retorna [] sin crash', async () => {
    // caso inválido controlado
    primeStatusMocks()

    const result = await taskService.bulkAssign({ title: 'Mass', employeeIds: [] }, 1)

    expect(result).toEqual([])
    expect(taskRepository.create).not.toHaveBeenCalled()
    expect(eventBus.publish).not.toHaveBeenCalled()
  })
})

// =====================================================================
// markOverdueTasksAsNotDone (check-overdue)
// =====================================================================
describe('taskService.markOverdueTasksAsNotDone', () => {
  it('G1 happy path: actualiza cada tarea vencida a NOT_DONE y publica evento', async () => {
    primeStatusMocks()
    mocked(taskRepository.findOverduePending).mockResolvedValue([fakeTask])
    mocked(taskRepository.update).mockResolvedValue({ ...fakeTask, statusId: 5 })
    mocked(employeeRepository.getEmployeeById).mockResolvedValue({ id: 3, name: 'Bob', email: 'b@x.y' })

    await taskService.markOverdueTasksAsNotDone()

    expect(taskRepository.update).toHaveBeenCalledWith(10, {
      status: { connect: { id: 5 } },
    })
    expect(eventBus.publish).toHaveBeenCalledWith('task.not_done', expect.any(Object))
  })

  it('G2 error de negocio: repo lanza → propaga', async () => {
    mocked(taskRepository.findOverduePending).mockRejectedValue(new Error('DB failure'))

    await expect(taskService.markOverdueTasksAsNotDone()).rejects.toThrow('DB failure')
  })

  it('G3 caso inválido controlado: no hay tareas vencidas → retorna early sin llamar update ni publicar', async () => {
    // caso inválido controlado — early return del servicio
    mocked(taskRepository.findOverduePending).mockResolvedValue([])

    await taskService.markOverdueTasksAsNotDone()

    expect(taskRepository.update).not.toHaveBeenCalled()
    expect(eventBus.publish).not.toHaveBeenCalled()
  })
})
