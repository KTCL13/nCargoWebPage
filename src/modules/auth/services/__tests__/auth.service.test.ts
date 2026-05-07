/// <reference types="jest" />

jest.mock('../../repositories/user.repository', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
  },
}))

jest.mock('../../repositories/role.repository', () => ({
  roleRepository: {
    findByName: jest.fn(),
    assignRoleToEmployee: jest.fn(),
    findIdentificationTypeByCode: jest.fn(),
  },
}))

jest.mock('../../repositories/session.repository', () => ({
  sessionRepository: {
    create: jest.fn(),
    findActiveByEmployee: jest.fn(),
    closeSession: jest.fn(),
  },
}))

jest.mock('../../repositories/password-reset.repository', () => ({
  passwordResetRepository: {
    create: jest.fn(),
    findValid: jest.fn(),
    markUsed: jest.fn(),
  },
}))

jest.mock('../hash.service', () => ({
  hashService: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}))

jest.mock('../jwt.service', () => ({
  jwtService: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
}))

jest.mock('@/lib/audit-logger', () => ({
  auditLog: jest.fn(),
}))

jest.mock('@/lib/email', () => ({
  sendPasswordResetEmail: jest.fn(),
}))

import { authService } from '../auth.service'
import { userRepository } from '../../repositories/user.repository'
import { roleRepository } from '../../repositories/role.repository'
import { sessionRepository } from '../../repositories/session.repository'
import { hashService } from '../hash.service'
import { jwtService } from '../jwt.service'
import { auditLog } from '@/lib/audit-logger'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

describe('authService.register', () => {
  const baseData = { firstName: 'Alice', lastName: 'Smith', identificationTypeId: 1, email: 'Alice@Example.COM', password: 'secret123', role: 'ADMIN' as const }

  it('happy path: creates user, assigns role, returns DTO with JWT', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue(null)
    mocked(hashService.hash).mockResolvedValue('hashed')
    mocked(userRepository.create).mockResolvedValue({ id: 1, firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' })
    mocked(roleRepository.findByName).mockResolvedValue({ id: 2, name: 'ADMIN' })
    mocked(roleRepository.assignRoleToEmployee).mockResolvedValue({ employeeId: 1, roleId: 2 })
    mocked(jwtService.sign).mockReturnValue('jwt-token')

    const result = await authService.register(baseData)

    expect(userRepository.findByEmail).toHaveBeenCalledWith('alice@example.com')
    expect(hashService.hash).toHaveBeenCalledWith('secret123')
    expect(userRepository.create).toHaveBeenCalledWith({
      firstName: 'Alice',
      lastName: 'Smith',
      identificationNumber: '',
      identificationTypeId: 1,
      email: 'alice@example.com',
      passwordHash: 'hashed',
    })
    expect(roleRepository.findByName).toHaveBeenCalledWith('ADMIN')
    expect(roleRepository.assignRoleToEmployee).toHaveBeenCalledWith(1, 2)
    expect(jwtService.sign).toHaveBeenCalledWith({ id: 1, email: 'alice@example.com', role: 'ADMIN' })
    expect(result).toEqual({ accessToken: 'jwt-token', role: 'ADMIN', email: 'alice@example.com', name: 'Alice Smith' })
  })

  it('rejects with "El nombre es obligatorio" when firstName is blank', async () => {
    await expect(authService.register({ ...baseData, firstName: '   ' })).rejects.toThrow('El nombre es obligatorio')
    expect(userRepository.findByEmail).not.toHaveBeenCalled()
    expect(hashService.hash).not.toHaveBeenCalled()
  })

  it('rejects with "El email es obligatorio" when email is missing', async () => {
    await expect(authService.register({ ...baseData, email: '' })).rejects.toThrow('El email es obligatorio')
  })

  it('rejects with "La contraseña es obligatoria" when password is blank', async () => {
    await expect(authService.register({ ...baseData, password: '  ' })).rejects.toThrow('La contraseña es obligatoria')
  })

  it('rejects with "El rol es obligatorio" when role is missing', async () => {
    await expect(authService.register({ ...baseData, role: undefined as any })).rejects.toThrow('El rol es obligatorio')
  })

  it('rejects with duplicate email message when user already exists', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue({ id: 99, email: 'alice@example.com' })
    await expect(authService.register(baseData)).rejects.toThrow('Ya existe un usuario con ese email')
    expect(hashService.hash).not.toHaveBeenCalled()
    expect(userRepository.create).not.toHaveBeenCalled()
  })

  it('rejects when role does not exist', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue(null)
    mocked(hashService.hash).mockResolvedValue('hashed')
    mocked(userRepository.create).mockResolvedValue({ id: 1, firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' })
    mocked(roleRepository.findByName).mockResolvedValue(null)

    await expect(authService.register(baseData)).rejects.toThrow('El rol no existe')
    expect(roleRepository.assignRoleToEmployee).not.toHaveBeenCalled()
    expect(jwtService.sign).not.toHaveBeenCalled()
  })
})

describe('authService.login', () => {
  const baseData = { email: 'Alice@Example.COM', password: 'secret123' }
  const employee = {
    id: 1,
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    passwordHash: 'stored-hash',
    employeeRoles: [{ role: { id: 2, name: 'ADMIN' } }],
  }

  it('happy path: validates password, creates session, logs audit, returns DTO', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue(employee)
    mocked(hashService.compare).mockResolvedValue(true)
    mocked(sessionRepository.create).mockResolvedValue({ id: 10 })
    mocked(auditLog).mockResolvedValue(undefined)
    mocked(jwtService.sign).mockReturnValue('jwt-token')

    const result = await authService.login(baseData, '1.1.1.1', 'UA/1.0')

    expect(userRepository.findByEmail).toHaveBeenCalledWith('alice@example.com')
    expect(hashService.compare).toHaveBeenCalledWith('secret123', 'stored-hash')
    expect(sessionRepository.create).toHaveBeenCalledWith({
      employeeId: 1,
      ipAddress: '1.1.1.1',
      deviceInfo: { userAgent: 'UA/1.0' },
    })
    expect(auditLog).toHaveBeenCalledWith({
      entityType: 'UserSession',
      entityId: 1,
      action: 'LOGIN',
      performedBy: 1,
      newValues: { ip: '1.1.1.1' },
    })
    expect(result).toEqual({ accessToken: 'jwt-token', role: 'ADMIN', email: 'alice@example.com', name: 'Alice Smith' })
  })

  it('passes deviceInfo=undefined when no userAgent is provided', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue(employee)
    mocked(hashService.compare).mockResolvedValue(true)
    mocked(sessionRepository.create).mockResolvedValue({ id: 10 })
    mocked(auditLog).mockResolvedValue(undefined)
    mocked(jwtService.sign).mockReturnValue('jwt-token')

    await authService.login(baseData, '1.1.1.1')

    expect(sessionRepository.create).toHaveBeenCalledWith({
      employeeId: 1,
      ipAddress: '1.1.1.1',
      deviceInfo: undefined,
    })
  })

  it('rejects with "El email es obligatorio" when email is missing', async () => {
    await expect(authService.login({ email: '', password: 'x' } as any, 'ip')).rejects.toThrow('El email es obligatorio')
  })

  it('rejects with "La contraseña es obligatoria" when password is blank', async () => {
    await expect(authService.login({ email: 'a@b.c', password: '  ' } as any, 'ip')).rejects.toThrow(
      'La contraseña es obligatoria',
    )
  })

  it('rejects with "Credenciales inválidas" when user does not exist', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue(null)
    await expect(authService.login(baseData, 'ip')).rejects.toThrow('Credenciales inválidas')
  })

  it('rejects with "Credenciales inválidas" when user has no passwordHash', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue({ ...employee, passwordHash: null })
    await expect(authService.login(baseData, 'ip')).rejects.toThrow('Credenciales inválidas')
  })

  it('rejects with "Credenciales inválidas" when password does not match', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue(employee)
    mocked(hashService.compare).mockResolvedValue(false)

    await expect(authService.login(baseData, 'ip')).rejects.toThrow('Credenciales inválidas')
    expect(sessionRepository.create).not.toHaveBeenCalled()
    expect(auditLog).not.toHaveBeenCalled()
  })

  it('rejects when employee has no role assigned', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue({ ...employee, employeeRoles: [] })
    mocked(hashService.compare).mockResolvedValue(true)

    await expect(authService.login(baseData, 'ip')).rejects.toThrow('El usuario no tiene rol asignado')
    expect(sessionRepository.create).not.toHaveBeenCalled()
  })
})

describe('authService.logout', () => {
  it('closes active session and logs audit', async () => {
    mocked(sessionRepository.findActiveByEmployee).mockResolvedValue({ id: 77, employeeId: 5 })
    mocked(sessionRepository.closeSession).mockResolvedValue({ id: 77 })
    mocked(auditLog).mockResolvedValue(undefined)

    await authService.logout(5)

    expect(sessionRepository.findActiveByEmployee).toHaveBeenCalledWith(5)
    expect(sessionRepository.closeSession).toHaveBeenCalledTimes(1)
    const [sessionId, logoutAt] = mocked(sessionRepository.closeSession).mock.calls[0]
    expect(sessionId).toBe(77)
    expect(logoutAt).toBeInstanceOf(Date)
    expect(auditLog).toHaveBeenCalledWith({
      entityType: 'UserSession',
      entityId: 5,
      action: 'LOGOUT',
      performedBy: 5,
    })
  })

  it('skips closeSession when there is no active session but still audits', async () => {
    mocked(sessionRepository.findActiveByEmployee).mockResolvedValue(null)
    mocked(auditLog).mockResolvedValue(undefined)

    await authService.logout(5)

    expect(sessionRepository.closeSession).not.toHaveBeenCalled()
    expect(auditLog).toHaveBeenCalledWith({
      entityType: 'UserSession',
      entityId: 5,
      action: 'LOGOUT',
      performedBy: 5,
    })
  })

  it('propagates errors from the session repository', async () => {
    mocked(sessionRepository.findActiveByEmployee).mockRejectedValue(new Error('db down'))
    await expect(authService.logout(5)).rejects.toThrow('db down')
  })
})
