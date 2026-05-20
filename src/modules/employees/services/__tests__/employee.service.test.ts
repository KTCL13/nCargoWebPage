/// <reference types="jest" />

// =====================================================================
// Pruebas unitarias del EmployeeService
// ---------------------------------------------------------------------
// Cubre los 9 métodos que expone el servicio con tres grupos por cada uno:
//   GRUPO 1 — Happy path
//   GRUPO 2 — Errores de negocio controlados
//   GRUPO 3 — Casos inválidos que el sistema maneja de forma controlada
// =====================================================================

jest.mock('../../repositories/employee.repository', () => ({
  employeeRepository: {
    create: jest.fn(),
    getEmployeeById: jest.fn(),
    getEmployees: jest.fn(),
    updateEmployee: jest.fn(),
    deleteEmployee: jest.fn(),
    findByIdentification: jest.fn(),
    findByEmailExcluding: jest.fn(),
    findByPhone: jest.fn(),
  },
}))

jest.mock('../../repositories/contract.repository', () => ({
  contractRepository: {
    getContractsByEmployeeId: jest.fn(),
    findById: jest.fn(),
    updateContract: jest.fn(),
    findActiveContract: jest.fn(),
    createContract: jest.fn(),
  },
}))

jest.mock('../../repositories/role.repository', () => ({
  roleRepository: {
    getRolesByEmployeeId: jest.fn(),
    assignRoleToEmployee: jest.fn(),
    findByIds: jest.fn(),
    findAll: jest.fn(),
  },
}))

jest.mock('../../repositories/jobHistory.repository', () => ({
  jobHistoryRepository: {
    getJobHistoryByEmployeeId: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
}))

jest.mock('../../../auth/services/hash.service', () => ({
  hashService: { hash: jest.fn(), compare: jest.fn() },
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: jest.fn() },
    contractType: { findUnique: jest.fn() },
    systemConfig: { findUnique: jest.fn() },
    contract: { updateMany: jest.fn() },
    jobHistory: { updateMany: jest.fn() },
    employeeRole: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import { employeeService } from '../employee.service'
import { employeeRepository } from '../../repositories/employee.repository'
import { contractRepository } from '../../repositories/contract.repository'
import { roleRepository } from '../../repositories/role.repository'
import { hashService } from '../../../auth/services/hash.service'
import { prisma } from '@/lib/prisma'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

const fakeEmployee = {
  id: 1,
  firstName: 'Alice',
  lastName: 'Smith',
  identificationNumber: '123456',
  identificationTypeId: 1,
  identificationType: { id: 1, code: 'CC', name: 'Cédula de ciudadanía', createdAt: new Date(), updatedAt: new Date() },
  email: 'a@b.c',
  status: 'ACTIVE',
  metadata: null,
  passwordHash: 'hash',
  timezone: 'America/Bogota',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

const fakeContract = {
  id: 10,
  employeeId: 1,
  jobId: 1,
  contractTypeId: 2,
  salary: 5000 as any,
  hourlyRate: 25 as any,
  startDate: new Date('2026-01-01'),
  endDate: null,
  isActive: true,
}

function primeResponseDtoMocks() {
  mocked(roleRepository.getRolesByEmployeeId).mockResolvedValue([{ id: 2, name: 'ADMIN' }])
  mocked(contractRepository.getContractsByEmployeeId).mockResolvedValue([])
  mocked((prisma as any).job.findUnique).mockResolvedValue({ id: 1, title: 'Dev', description: null })
  mocked((prisma as any).contractType.findUnique).mockResolvedValue({ id: 2, name: 'INDEFINITE' })
}

// =====================================================================
// findAll
// =====================================================================
describe('employeeService.findAll', () => {
  it('G1 happy path: retorna empleados paginados', async () => {
    primeResponseDtoMocks()
    mocked(employeeRepository.getEmployees).mockResolvedValue({ employees: [fakeEmployee], total: 1 })

    const result = await employeeService.findAll({ page: 2, limit: 5 })

    expect(employeeRepository.getEmployees).toHaveBeenCalledWith({ page: 2, limit: 5 })
    expect(result.total).toBe(1)
    expect(result.page).toBe(2)
    expect(result.limit).toBe(5)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].roles).toEqual(['ADMIN'])
  })

  it('G2 error de negocio: el repo lanza → propaga', async () => {
    mocked(employeeRepository.getEmployees).mockRejectedValue(new Error('DB error'))

    await expect(employeeService.findAll({})).rejects.toThrow('DB error')
  })

  it('G3 caso inválido controlado: filter vacío usa defaults page=1, limit=10', async () => {
    // caso inválido controlado
    primeResponseDtoMocks()
    mocked(employeeRepository.getEmployees).mockResolvedValue({ employees: [], total: 0 })

    const result = await employeeService.findAll({})

    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
    expect(result.data).toEqual([])
  })
})

// =====================================================================
// findOne
// =====================================================================
describe('employeeService.findOne', () => {
  it('G1 happy path: retorna DTO del empleado', async () => {
    primeResponseDtoMocks()
    mocked(employeeRepository.getEmployeeById).mockResolvedValue(fakeEmployee)

    const result = await employeeService.findOne(1)

    expect(employeeRepository.getEmployeeById).toHaveBeenCalledWith(1)
    expect(result.id).toBe(1)
    expect(result.roles).toEqual(['ADMIN'])
  })

  it('G2 error de negocio: empleado no existe → lanza "Employee not found with id X"', async () => {
    mocked(employeeRepository.getEmployeeById).mockResolvedValue(null)

    await expect(employeeService.findOne(999)).rejects.toThrow('Employee not found with id 999')
  })

  it('G3 caso inválido controlado: id=NaN → repo retorna null → lanza el mismo error', async () => {
    // caso inválido controlado
    mocked(employeeRepository.getEmployeeById).mockResolvedValue(null)

    await expect(employeeService.findOne(NaN)).rejects.toThrow('Employee not found with id NaN')
  })
})

// =====================================================================
// create
// =====================================================================
describe('employeeService.create', () => {
  const validData = {
    firstName: 'Alice',
    lastName: 'Smith',
    identificationNumber: '123456',
    identificationTypeId: 1,
    email: 'a@b.c',
    password: 'Secret123',
    status: 'ACTIVE' as const,
    roleIds: [1, 2],
  }

  function primeTxMock() {
    const employeeCreate = jest.fn().mockResolvedValue(fakeEmployee)
    const employeeRoleCreate = jest.fn().mockResolvedValue({})
    const contractCreate = jest.fn().mockResolvedValue({ id: 99, jobId: 1, startDate: new Date() })
    const jobHistoryCreate = jest.fn().mockResolvedValue({})
    mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({
        employee: { create: employeeCreate },
        employeeRole: { create: employeeRoleCreate },
        contract: { create: contractCreate },
        jobHistory: { create: jobHistoryCreate },
      }),
    )
    return { employeeCreate, employeeRoleCreate, contractCreate, jobHistoryCreate }
  }

  it('G1 happy path: hashea password, crea empleado y asigna todos los roles', async () => {
    primeResponseDtoMocks()
    mocked(employeeRepository.findByIdentification).mockResolvedValue(null)
    mocked(employeeRepository.findByEmailExcluding).mockResolvedValue(null)
    mocked(hashService.hash).mockResolvedValue('hashed-pw')
    const tx = primeTxMock()

    const result = await employeeService.create(validData)

    expect(hashService.hash).toHaveBeenCalledWith('Secret123')
    expect(tx.employeeCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        firstName: 'Alice',
        lastName: 'Smith',
        identificationNumber: '123456',
        identificationTypeId: 1,
        email: 'a@b.c',
        passwordHash: 'hashed-pw',
        status: 'ACTIVE',
      }),
    }))
    expect(tx.employeeRoleCreate).toHaveBeenCalledTimes(2)
    expect(tx.employeeRoleCreate).toHaveBeenNthCalledWith(1, { data: { employeeId: 1, roleId: 1 } })
    expect(tx.employeeRoleCreate).toHaveBeenNthCalledWith(2, { data: { employeeId: 1, roleId: 2 } })
    expect(result.id).toBe(1)
  })

  it('G2 error de negocio: email duplicado en repo → propaga', async () => {
    mocked(employeeRepository.findByIdentification).mockResolvedValue(null)
    mocked(employeeRepository.findByEmailExcluding).mockResolvedValue({ id: 99, email: 'a@b.c' } as any)

    await expect(employeeService.create(validData)).rejects.toThrow(/ya está registrado/)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('G3 caso inválido controlado: roleIds=[] → no se invoca employeeRole.create', async () => {
    primeResponseDtoMocks()
    mocked(employeeRepository.findByIdentification).mockResolvedValue(null)
    mocked(employeeRepository.findByEmailExcluding).mockResolvedValue(null)
    mocked(hashService.hash).mockResolvedValue('hashed-pw')
    const tx = primeTxMock()

    const result = await employeeService.create({ ...validData, roleIds: [] })

    expect(tx.employeeRoleCreate).not.toHaveBeenCalled()
    expect(result.id).toBe(1)
  })
})

// =====================================================================
// update
// =====================================================================
describe('employeeService.update', () => {
  it('G1 happy path: actualiza y retorna DTO', async () => {
    primeResponseDtoMocks()
    mocked(employeeRepository.updateEmployee).mockResolvedValue({ ...fakeEmployee, lastName: 'Smith 2' })

    const result = await employeeService.update(1, { lastName: 'Smith 2' })

    expect(employeeRepository.updateEmployee).toHaveBeenCalledWith(1, { lastName: 'Smith 2' })
    expect(result.name).toBe('Alice Smith 2')
  })

  it('G2 error de negocio: registro no encontrado → propaga', async () => {
    mocked(employeeRepository.updateEmployee).mockRejectedValue(new Error('Record to update not found'))

    await expect(employeeService.update(999, { firstName: 'x' })).rejects.toThrow('Record to update not found')
  })

  it('G3 caso inválido controlado: data vacía {} → repo recibe {} sin crash', async () => {
    // caso inválido controlado
    primeResponseDtoMocks()
    mocked(employeeRepository.updateEmployee).mockResolvedValue(fakeEmployee)

    await employeeService.update(1, {})

    expect(employeeRepository.updateEmployee).toHaveBeenCalledWith(1, {})
  })
})

// =====================================================================
// remove (soft-delete)
// =====================================================================
describe('employeeService.remove', () => {
  it('G1 happy path: cierra contratos/jobHistory y llama al repo para soft-delete', async () => {
    mocked(prisma.$transaction).mockResolvedValue([])
    mocked(employeeRepository.deleteEmployee).mockResolvedValue(undefined)

    await employeeService.remove(1)

    expect(prisma.$transaction).toHaveBeenCalled()
    expect(employeeRepository.deleteEmployee).toHaveBeenCalledWith(1)
  })

  it('G2 error de negocio: empleado no existe → propaga', async () => {
    mocked(prisma.$transaction).mockResolvedValue([])
    mocked(employeeRepository.deleteEmployee).mockRejectedValue(new Error('Employee not found'))

    await expect(employeeService.remove(999)).rejects.toThrow('Employee not found')
  })

  it('G3 caso inválido controlado: id=NaN → repo recibe NaN sin crash propio', async () => {
    mocked(prisma.$transaction).mockResolvedValue([])
    mocked(employeeRepository.deleteEmployee).mockResolvedValue(undefined)

    await employeeService.remove(NaN)

    expect(employeeRepository.deleteEmployee).toHaveBeenCalledWith(NaN)
  })
})

// =====================================================================
// getContracts
// =====================================================================
describe('employeeService.getContracts', () => {
  it('G1 happy path: retorna contratos mapeados a DTO', async () => {
    primeResponseDtoMocks()
    mocked(contractRepository.getContractsByEmployeeId).mockResolvedValue([fakeContract])

    const result = await employeeService.getContracts(1)

    expect(contractRepository.getContractsByEmployeeId).toHaveBeenCalledWith(1)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(10)
    expect(result[0].contractType).toEqual({ id: 2, name: 'INDEFINITE' })
  })

  it('G2 error de negocio: repo lanza → propaga', async () => {
    mocked(contractRepository.getContractsByEmployeeId).mockRejectedValue(new Error('DB failure'))

    await expect(employeeService.getContracts(1)).rejects.toThrow('DB failure')
  })

  it('G3 caso inválido controlado: employeeId=NaN → repo retorna [] → retorna []', async () => {
    // caso inválido controlado
    mocked(contractRepository.getContractsByEmployeeId).mockResolvedValue([])

    const result = await employeeService.getContracts(NaN)

    expect(result).toEqual([])
  })
})

// =====================================================================
// findContractById
// =====================================================================
describe('employeeService.findContractById', () => {
  it('G1 happy path: retorna DTO del contrato', async () => {
    primeResponseDtoMocks()
    mocked(contractRepository.findById).mockResolvedValue(fakeContract)

    const result = await employeeService.findContractById(10)

    expect(contractRepository.findById).toHaveBeenCalledWith(10)
    expect(result.id).toBe(10)
  })

  it('G2 error de negocio: contrato no existe → lanza "Contract not found with id X"', async () => {
    mocked(contractRepository.findById).mockResolvedValue(null)

    await expect(employeeService.findContractById(999)).rejects.toThrow('Contract not found with id 999')
  })

  it('G3 caso inválido controlado: contractId=NaN → repo retorna null → lanza el mismo error', async () => {
    // caso inválido controlado
    mocked(contractRepository.findById).mockResolvedValue(null)

    await expect(employeeService.findContractById(NaN)).rejects.toThrow('Contract not found with id NaN')
  })
})

// =====================================================================
// createContract
// =====================================================================
describe('employeeService.createContract', () => {
  const validData = {
    jobId: 1,
    contractTypeId: 2,
    salary: 5000,
    hourlyRate: 25,
    startDate: new Date('2026-01-01') as any,
  }

  it('G1 happy path: la transacción retorna el contrato y se mapea a DTO', async () => {
    primeResponseDtoMocks()
    mocked((prisma as any).$transaction).mockResolvedValue(fakeContract)

    const result = await employeeService.createContract(1, validData)

    expect((prisma as any).$transaction).toHaveBeenCalledTimes(1)
    expect(result.id).toBe(10)
    expect(result.isActive).toBe(true)
  })

  it('G2 error de negocio: la transacción falla → propaga', async () => {
    mocked((prisma as any).$transaction).mockRejectedValue(new Error('Transaction failed'))

    await expect(employeeService.createContract(1, validData)).rejects.toThrow('Transaction failed')
  })

  it('G3 caso inválido controlado: endDate=undefined → la transacción se ejecuta igual', async () => {
    // caso inválido controlado
    primeResponseDtoMocks()
    mocked((prisma as any).$transaction).mockResolvedValue(fakeContract)

    const result = await employeeService.createContract(1, { ...validData, endDate: undefined })

    expect((prisma as any).$transaction).toHaveBeenCalled()
    expect(result.endDate).toBeNull()
  })
})

// =====================================================================
// updateContract
// =====================================================================
describe('employeeService.updateContract', () => {
  it('G1 happy path: retorna DTO del contrato actualizado', async () => {
    primeResponseDtoMocks()
    mocked(contractRepository.updateContract).mockResolvedValue({ ...fakeContract, salary: 8000 as any })

    const result = await employeeService.updateContract(10, { salary: 8000 })

    expect(contractRepository.updateContract).toHaveBeenCalledWith(10, { salary: 8000 })
    expect(result.salary).toBe(8000)
  })

  it('G2 error de negocio: contrato no existe → propaga', async () => {
    mocked(contractRepository.updateContract).mockRejectedValue(new Error('Record to update not found'))

    await expect(employeeService.updateContract(999, {})).rejects.toThrow('Record to update not found')
  })

  it('G3 caso inválido controlado: data vacía {} → repo recibe {} sin crash', async () => {
    // caso inválido controlado
    primeResponseDtoMocks()
    mocked(contractRepository.updateContract).mockResolvedValue(fakeContract)

    await employeeService.updateContract(10, {})

    expect(contractRepository.updateContract).toHaveBeenCalledWith(10, {})
  })
})
