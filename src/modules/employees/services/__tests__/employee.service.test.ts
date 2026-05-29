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
import { jobHistoryRepository } from '../../repositories/jobHistory.repository'
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
  email: 'a@b.com',
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
    email: 'a@b.com',
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
        email: 'a@b.com',
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
    mocked(employeeRepository.findByEmailExcluding).mockResolvedValue({ id: 99, email: 'a@b.com' } as any)

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

// =====================================================================
// checkDuplicates
// =====================================================================
describe('employeeService.checkDuplicates', () => {
  beforeEach(() => jest.clearAllMocks())

  it('G1 happy path: retorna {} cuando no hay duplicados', async () => {
    mocked(employeeRepository.findByEmailExcluding).mockResolvedValue(null)
    mocked(employeeRepository.findByPhone).mockResolvedValue(null)

    const result = await employeeService.checkDuplicates('a@b.com', '3001234567')

    expect(result).toEqual({})
    expect(employeeRepository.findByEmailExcluding).toHaveBeenCalledWith('a@b.com', undefined)
    expect(employeeRepository.findByPhone).toHaveBeenCalledWith('3001234567', undefined)
  })

  it('G2 retorna emailOwner cuando el email ya existe', async () => {
    mocked(employeeRepository.findByEmailExcluding).mockResolvedValue({ id: 5, firstName: 'Bob', lastName: 'Smith' } as any)
    mocked(employeeRepository.findByPhone).mockResolvedValue(null)

    const result = await employeeService.checkDuplicates('dup@b.com', '')

    expect(result.emailOwner).toBe('Bob Smith')
    expect(result.phoneOwner).toBeUndefined()
  })

  it('G3 retorna phoneOwner cuando el teléfono ya existe, excluye excludeId', async () => {
    mocked(employeeRepository.findByEmailExcluding).mockResolvedValue(null)
    mocked(employeeRepository.findByPhone).mockResolvedValue({ id: 7, firstName: 'Ana', lastName: 'Ruiz' } as any)

    const result = await employeeService.checkDuplicates('', '300', 99)

    expect(result.phoneOwner).toBe('Ana Ruiz')
    expect(employeeRepository.findByPhone).toHaveBeenCalledWith('300', 99)
  })
})

// =====================================================================
// create — paths adicionales no cubiertos
// =====================================================================
describe('employeeService.create (paths adicionales)', () => {
  const base = {
    firstName: 'Alice', lastName: 'Smith', identificationNumber: '123456',
    identificationTypeId: 1, email: 'a@b.com', password: 'Secret123',
    status: 'ACTIVE' as const, roleIds: [1],
  }

  beforeEach(() => jest.clearAllMocks())

  it('G4 duplicado de número de identificación → lanza error con el tipo de documento', async () => {
    mocked(employeeRepository.findByIdentification).mockResolvedValue({
      id: 5, identificationType: { name: 'Cédula de ciudadanía' },
    } as any)

    await expect(employeeService.create(base)).rejects.toThrow(/Cédula de ciudadanía/)
    expect(employeeRepository.findByEmailExcluding).not.toHaveBeenCalled()
  })

  it('G5 contraseña inválida (sin mayúscula) → lanza antes de DB write', async () => {
    mocked(employeeRepository.findByIdentification).mockResolvedValue(null)
    mocked(employeeRepository.findByEmailExcluding).mockResolvedValue(null)

    await expect(
      employeeService.create({ ...base, password: 'secret123' }),
    ).rejects.toThrow(/mayúscula/)
    expect(hashService.hash).not.toHaveBeenCalled()
  })

  it('G6 con initialContract: crea contrato y jobHistory dentro de la transacción', async () => {
    mocked(employeeRepository.findByIdentification).mockResolvedValue(null)
    mocked(employeeRepository.findByEmailExcluding).mockResolvedValue(null)
    mocked(hashService.hash).mockResolvedValue('hashed-pw')
    mocked((prisma as any).contractType.findUnique).mockResolvedValue({ id: 2, name: 'INDEFINITE' })
    mocked((prisma as any).systemConfig.findUnique).mockResolvedValue(null)
    mocked(roleRepository.getRolesByEmployeeId).mockResolvedValue([{ id: 2, name: 'ADMIN' }])
    mocked(contractRepository.getContractsByEmployeeId).mockResolvedValue([])
    mocked((prisma as any).job.findUnique).mockResolvedValue({ id: 1, title: 'Dev', description: null })

    const contractCreate = jest.fn().mockResolvedValue({ id: 99, jobId: 1, startDate: new Date('2026-01-01'), endDate: null, isActive: true })
    const jobHistoryCreate = jest.fn().mockResolvedValue({})
    const employeeCreate = jest.fn().mockResolvedValue({
      id: 1, firstName: 'Alice', lastName: 'Smith', identificationNumber: '123456',
      identificationTypeId: 1, identificationType: { id: 1, code: 'CC', name: 'Cédula' },
      email: 'a@b.com', status: 'ACTIVE', metadata: null, passwordHash: 'hashed-pw',
      timezone: 'America/Bogota', createdAt: new Date(), updatedAt: new Date(),
    })

    mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({
        employee: { create: employeeCreate },
        employeeRole: { create: jest.fn().mockResolvedValue({}) },
        contract: { create: contractCreate },
        jobHistory: { create: jobHistoryCreate },
      }),
    )

    const result = await employeeService.create({
      ...base,
      initialContract: {
        jobId: 1, contractTypeId: 2, salary: 5000, hourlyRate: 0,
        startDate: new Date('2026-01-01') as any,
      } as any,
    })

    expect(contractCreate).toHaveBeenCalled()
    expect(jobHistoryCreate).toHaveBeenCalled()
    expect(result.id).toBe(1)
  })
})

// =====================================================================
// update — paths adicionales (email, INACTIVE, roleIds)
// =====================================================================
describe('employeeService.update (paths adicionales)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('G4 email inválido lanza error de validación', async () => {
    await expect(
      employeeService.update(1, { email: 'not-an-email' }),
    ).rejects.toThrow(/correo/)
  })

  it('G5 status=INACTIVE cierra contratos activos y jobHistory abierto', async () => {
    mocked(employeeRepository.updateEmployee).mockResolvedValue({
      id: 1, firstName: 'Alice', lastName: 'Smith', identificationNumber: '123456',
      identificationTypeId: 1, identificationType: { id: 1, code: 'CC', name: 'Cédula' },
      email: 'a@b.com', status: 'INACTIVE', metadata: null, passwordHash: 'hash',
      timezone: 'America/Bogota', createdAt: new Date(), updatedAt: new Date(),
    })
    mocked(roleRepository.getRolesByEmployeeId).mockResolvedValue([])
    mocked(contractRepository.getContractsByEmployeeId).mockResolvedValue([])
    mocked((prisma as any).contract.updateMany).mockResolvedValue({ count: 1 })
    mocked((prisma as any).jobHistory.updateMany).mockResolvedValue({ count: 1 })

    await employeeService.update(1, { status: 'INACTIVE' })

    expect((prisma as any).contract.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ employeeId: 1, isActive: true }) }),
    )
    expect((prisma as any).jobHistory.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ employeeId: 1, endDate: null }) }),
    )
  })

  it('G6 roleIds: borra roles anteriores y asigna los nuevos', async () => {
    mocked(employeeRepository.updateEmployee).mockResolvedValue({
      id: 1, firstName: 'Alice', lastName: 'Smith', identificationNumber: '123456',
      identificationTypeId: 1, identificationType: { id: 1, code: 'CC', name: 'Cédula' },
      email: 'a@b.com', status: 'ACTIVE', metadata: null, passwordHash: 'hash',
      timezone: 'America/Bogota', createdAt: new Date(), updatedAt: new Date(),
    })
    mocked(roleRepository.getRolesByEmployeeId).mockResolvedValue([{ id: 3, name: 'EMPLOYEE' }])
    mocked(contractRepository.getContractsByEmployeeId).mockResolvedValue([])
    mocked((prisma as any).employeeRole.deleteMany).mockResolvedValue({ count: 1 })
    mocked(roleRepository.assignRoleToEmployee).mockResolvedValue({ employeeId: 1, roleId: 3 } as any)

    await employeeService.update(1, { roleIds: [3] })

    expect((prisma as any).employeeRole.deleteMany).toHaveBeenCalledWith({ where: { employeeId: 1 } })
    expect(roleRepository.assignRoleToEmployee).toHaveBeenCalledWith(1, 3)
  })
})

// =====================================================================
// createContract — transacción ejecutada (callback real)
// =====================================================================
describe('employeeService.createContract (transacción real)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('G4 ejecuta la transacción: cierra contratos previos y crea contrato + jobHistory', async () => {
    mocked((prisma as any).contractType.findUnique).mockResolvedValue({ id: 2, name: 'INDEFINITE' })
    mocked((prisma as any).systemConfig.findUnique).mockResolvedValue(null)
    mocked((prisma as any).job.findUnique).mockResolvedValue({ id: 1, title: 'Dev', description: null })

    const contractUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const jobHistoryUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const newContract = { id: 20, employeeId: 1, jobId: 1, contractTypeId: 2, salary: 5000 as any, hourlyRate: 25 as any, startDate: new Date('2026-01-01'), endDate: null, isActive: true }
    const contractCreate = jest.fn().mockResolvedValue(newContract)
    const jobHistoryCreate = jest.fn().mockResolvedValue({})

    mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({
        contract: { updateMany: contractUpdateMany, create: contractCreate },
        jobHistory: { updateMany: jobHistoryUpdateMany, create: jobHistoryCreate },
      }),
    )

    const result = await employeeService.createContract(1, {
      jobId: 1, contractTypeId: 2, salary: 5000, hourlyRate: 25,
      startDate: new Date('2026-01-01') as any,
    })

    expect(contractUpdateMany).toHaveBeenCalled()
    expect(jobHistoryUpdateMany).toHaveBeenCalled()
    expect(contractCreate).toHaveBeenCalled()
    expect(jobHistoryCreate).toHaveBeenCalled()
    expect(result.id).toBe(20)
  })
})

// =====================================================================
// validateContractRates — a través de createContract
// =====================================================================
describe('validateContractRates (vía createContract)', () => {
  const baseData = {
    jobId: 1, contractTypeId: 2,
    salary: 5000, hourlyRate: 25,
    startDate: new Date('2026-01-01') as any,
  }

  beforeEach(() => jest.clearAllMocks())

  it('lanza cuando el salario supera el máximo permitido', async () => {
    mocked((prisma as any).contractType.findUnique).mockResolvedValue({ id: 2, name: 'MENSUAL' })
    mocked((prisma as any).systemConfig.findUnique).mockResolvedValue(null)

    await expect(
      employeeService.createContract(1, { ...baseData, salary: 10_000_000_000 }),
    ).rejects.toThrow(/salario/)
  })

  it('lanza cuando el salario está por debajo del SMLV configurado', async () => {
    mocked((prisma as any).contractType.findUnique).mockResolvedValue({ id: 2, name: 'MENSUAL' })
    mocked((prisma as any).systemConfig.findUnique)
      .mockResolvedValueOnce({ key: 'smlv', value: '2000000' })
      .mockResolvedValueOnce(null)

    await expect(
      employeeService.createContract(1, { ...baseData, salary: 500 }),
    ).rejects.toThrow(/SMLV/)
  })

  it('lanza cuando la tarifa por hora supera el máximo (contrato por hora)', async () => {
    mocked((prisma as any).contractType.findUnique).mockResolvedValue({ id: 3, name: 'POR HORA' })
    mocked((prisma as any).systemConfig.findUnique).mockResolvedValue(null)

    await expect(
      employeeService.createContract(1, { ...baseData, contractTypeId: 3, hourlyRate: 100_000_000 }),
    ).rejects.toThrow(/tarifa por hora/)
  })

  it('lanza cuando la tarifa por hora está por debajo del mínimo legal (contrato por hora)', async () => {
    mocked((prisma as any).contractType.findUnique).mockResolvedValue({ id: 3, name: 'POR HORA' })
    mocked((prisma as any).systemConfig.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ key: 'min_hourly_rate', value: '20000' })

    await expect(
      employeeService.createContract(1, { ...baseData, contractTypeId: 3, hourlyRate: 1 }),
    ).rejects.toThrow(/mínimo legal/)
  })
})

// =====================================================================
// updateContract — límites y endDate
// =====================================================================
describe('employeeService.updateContract (límites y endDate)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('G4 lanza cuando el salario supera el límite', async () => {
    await expect(
      employeeService.updateContract(10, { salary: 10_000_000_001 }),
    ).rejects.toThrow(/salario/)
  })

  it('G5 lanza cuando la tarifa por hora supera el límite', async () => {
    await expect(
      employeeService.updateContract(10, { hourlyRate: 100_000_001 }),
    ).rejects.toThrow(/tarifa por hora/)
  })

  it('G6 convierte endDate string a Date antes de llamar al repo', async () => {
    mocked((prisma as any).contractType.findUnique).mockResolvedValue({ id: 2, name: 'INDEFINITE' })
    mocked((prisma as any).job.findUnique).mockResolvedValue({ id: 1, title: 'Dev', description: null })
    mocked(contractRepository.updateContract).mockResolvedValue({
      id: 10, employeeId: 1, jobId: 1, contractTypeId: 2,
      salary: 5000 as any, hourlyRate: 25 as any,
      startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), isActive: true,
    })

    await employeeService.updateContract(10, { endDate: '2026-12-31' as any })

    const callArg = mocked(contractRepository.updateContract).mock.calls[0][1]
    expect(callArg.endDate).toBeInstanceOf(Date)
  })
})

// =====================================================================
// getJobHistory
// =====================================================================
describe('employeeService.getJobHistory', () => {
  beforeEach(() => jest.clearAllMocks())

  it('G1 happy path: retorna el historial del repo', async () => {
    const history = [{ id: 1, employeeId: 1, contractId: 10, startDate: new Date(), endDate: null }]
    mocked(jobHistoryRepository.getJobHistoryByEmployeeId).mockResolvedValue(history as any)

    const result = await employeeService.getJobHistory(1)

    expect(jobHistoryRepository.getJobHistoryByEmployeeId).toHaveBeenCalledWith(1)
    expect(result).toBe(history)
  })

  it('G2 repo lanza → propaga', async () => {
    mocked(jobHistoryRepository.getJobHistoryByEmployeeId).mockRejectedValue(new Error('DB error'))

    await expect(employeeService.getJobHistory(1)).rejects.toThrow('DB error')
  })
})

// =====================================================================
// assignRoles
// =====================================================================
describe('employeeService.assignRoles', () => {
  beforeEach(() => jest.clearAllMocks())

  it('G1 happy path: asigna todos los roles y retorna DTO del empleado', async () => {
    mocked(roleRepository.assignRoleToEmployee).mockResolvedValue({ employeeId: 1, roleId: 2 } as any)
    mocked(employeeRepository.getEmployeeById).mockResolvedValue({
      id: 1, firstName: 'Alice', lastName: 'Smith', identificationNumber: '123456',
      identificationTypeId: 1, identificationType: { id: 1, code: 'CC', name: 'Cédula' },
      email: 'a@b.com', status: 'ACTIVE', metadata: null, passwordHash: 'hash',
      timezone: 'America/Bogota', createdAt: new Date(), updatedAt: new Date(),
    })
    mocked(roleRepository.getRolesByEmployeeId).mockResolvedValue([{ id: 2, name: 'ADMIN' }])
    mocked(contractRepository.getContractsByEmployeeId).mockResolvedValue([])

    const result = await employeeService.assignRoles(1, { roleIds: [2] })

    expect(roleRepository.assignRoleToEmployee).toHaveBeenCalledWith(1, 2)
    expect(result.roles).toEqual(['ADMIN'])
  })

  it('G2 empleado no existe → lanza "Employee not found with id X"', async () => {
    mocked(roleRepository.assignRoleToEmployee).mockResolvedValue({ employeeId: 1, roleId: 2 } as any)
    mocked(employeeRepository.getEmployeeById).mockResolvedValue(null)

    await expect(employeeService.assignRoles(999, { roleIds: [2] })).rejects.toThrow('Employee not found with id 999')
  })

  it('G3 roleIds vacío: no llama assignRoleToEmployee pero sí busca el empleado', async () => {
    mocked(employeeRepository.getEmployeeById).mockResolvedValue({
      id: 1, firstName: 'Alice', lastName: 'Smith', identificationNumber: '123456',
      identificationTypeId: 1, identificationType: { id: 1, code: 'CC', name: 'Cédula' },
      email: 'a@b.com', status: 'ACTIVE', metadata: null, passwordHash: 'hash',
      timezone: 'America/Bogota', createdAt: new Date(), updatedAt: new Date(),
    })
    mocked(roleRepository.getRolesByEmployeeId).mockResolvedValue([])
    mocked(contractRepository.getContractsByEmployeeId).mockResolvedValue([])

    await employeeService.assignRoles(1, { roleIds: [] })

    expect(roleRepository.assignRoleToEmployee).not.toHaveBeenCalled()
  })
})
