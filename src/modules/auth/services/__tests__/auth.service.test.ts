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
    closeSessionByJti: jest.fn(),
    closeAllActiveByEmployee: jest.fn(),
    evictOldestIfAtLimit: jest.fn(),
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

jest.mock('@/lib/secure-logger', () => ({
  secureAuditLog: jest.fn().mockResolvedValue(undefined),
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
import { secureAuditLog } from '@/lib/secure-logger'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

describe('authService.register', () => {
  const baseData = { firstName: 'Alice', lastName: 'Smith', identificationTypeId: 1, email: 'Alice@Example.COM', password: 'Secret123' }

  it('happy path: creates user, assigns EMPLOYEE role (ignores any client-supplied role), returns DTO with JWT', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue(null)
    mocked(hashService.hash).mockResolvedValue('hashed')
    mocked(userRepository.create).mockResolvedValue({ id: 1, firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' })
    mocked(roleRepository.findByName).mockResolvedValue({ id: 2, name: 'EMPLOYEE' })
    mocked(roleRepository.assignRoleToEmployee).mockResolvedValue({ employeeId: 1, roleId: 2 })
    mocked(jwtService.sign).mockReturnValue({ token: 'jwt-token', jti: 'test-jti' })

    const result = await authService.register({ ...baseData, role: 'ADMIN' } as any)

    expect(userRepository.findByEmail).toHaveBeenCalledWith('alice@example.com')
    expect(hashService.hash).toHaveBeenCalledWith('Secret123')
    expect(userRepository.create).toHaveBeenCalledWith({
      firstName: 'Alice',
      lastName: 'Smith',
      identificationNumber: '',
      identificationTypeId: 1,
      email: 'alice@example.com',
      passwordHash: 'hashed',
    })
    expect(roleRepository.findByName).toHaveBeenCalledWith('EMPLOYEE')
    expect(roleRepository.assignRoleToEmployee).toHaveBeenCalledWith(1, 2)
    expect(jwtService.sign).toHaveBeenCalledWith({ id: 1, email: 'alice@example.com', role: 'EMPLOYEE' })
    expect(result).toEqual({ accessToken: 'jwt-token', role: 'EMPLOYEE', email: 'alice@example.com', name: 'Alice Smith' })
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

  it('rejects weak password (no uppercase)', async () => {
    await expect(authService.register({ ...baseData, password: 'weakpass1' })).rejects.toThrow(/mayúscula/)
  })

  it('rejects with duplicate email message when user already exists', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue({ id: 99, email: 'alice@example.com' })
    await expect(authService.register(baseData)).rejects.toThrow('Ya existe un usuario con ese email')
    expect(hashService.hash).not.toHaveBeenCalled()
    expect(userRepository.create).not.toHaveBeenCalled()
  })

  it('rejects when EMPLOYEE role does not exist in DB', async () => {
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
    status: 'ACTIVE',
    employeeRoles: [{ role: { id: 2, name: 'ADMIN' } }],
  }

  beforeEach(() => jest.clearAllMocks())

  it('happy path: validates password, creates session, logs audit, returns DTO', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue(employee)
    mocked(hashService.compare).mockResolvedValue(true)
    mocked(sessionRepository.evictOldestIfAtLimit).mockResolvedValue(null)
    mocked(sessionRepository.create).mockResolvedValue({ id: 10 })
    mocked(jwtService.sign).mockReturnValue({ token: 'jwt-token', jti: 'test-jti' })

    const result = await authService.login(baseData, '1.1.1.1', 'UA/1.0')

    expect(userRepository.findByEmail).toHaveBeenCalledWith('alice@example.com')
    expect(hashService.compare).toHaveBeenCalledWith('secret123', 'stored-hash')
    expect(sessionRepository.evictOldestIfAtLimit).toHaveBeenCalledWith(1)
    expect(sessionRepository.create).toHaveBeenCalledWith({
      employeeId: 1,
      ipAddress: '1.1.1.1',
      deviceInfo: { userAgent: 'UA/1.0' },
      tokenJti: 'test-jti',
    })
    expect(secureAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'LOGIN',
      performedBy: 1,
      ipAddress: '1.1.1.1',
    }))
    expect(result).toEqual({ accessToken: 'jwt-token', role: 'ADMIN', email: 'alice@example.com', name: 'Alice Smith' })
  })

  it('passes deviceInfo=undefined when no userAgent is provided', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue(employee)
    mocked(hashService.compare).mockResolvedValue(true)
    mocked(sessionRepository.evictOldestIfAtLimit).mockResolvedValue(null)
    mocked(sessionRepository.create).mockResolvedValue({ id: 10 })
    mocked(jwtService.sign).mockReturnValue({ token: 'jwt-token', jti: 'test-jti' })

    await authService.login(baseData, '1.1.1.1')

    expect(sessionRepository.create).toHaveBeenCalledWith({
      employeeId: 1,
      ipAddress: '1.1.1.1',
      deviceInfo: undefined,
      tokenJti: 'test-jti',
    })
  })

  it('rejects with "El email es obligatorio" when email is missing', async () => {
    await expect(authService.login({ email: '', password: 'x' } as any, 'ip')).rejects.toThrow('El email es obligatorio')
  })

  it('rejects with "La contraseña es obligatoria" when password is blank', async () => {
    await expect(authService.login({ email: 'a@b.c', password: '  ' } as any, 'ip')).rejects.toThrow('La contraseña es obligatoria')
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
    expect(secureAuditLog).not.toHaveBeenCalled()
  })

  it('rejects when employee has no role assigned', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue({ ...employee, employeeRoles: [] })
    mocked(hashService.compare).mockResolvedValue(true)

    await expect(authService.login(baseData, 'ip')).rejects.toThrow('El usuario no tiene rol asignado')
    expect(sessionRepository.create).not.toHaveBeenCalled()
  })
})

describe('authService.logout', () => {
  beforeEach(() => jest.clearAllMocks())

  it('closes session by jti when jti is provided', async () => {
    mocked(sessionRepository.closeSessionByJti).mockResolvedValue(undefined)

    await authService.logout(5, 'some-jti', '2.2.2.2')

    expect(sessionRepository.closeSessionByJti).toHaveBeenCalledWith('some-jti', expect.any(Date))
    expect(secureAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'LOGOUT',
      performedBy: 5,
      ipAddress: '2.2.2.2',
    }))
  })

  it('falls back to findActiveByEmployee when no jti is provided', async () => {
    mocked(sessionRepository.findActiveByEmployee).mockResolvedValue({ id: 77, employeeId: 5 })
    mocked(sessionRepository.closeSession).mockResolvedValue({ id: 77 })

    await authService.logout(5)

    expect(sessionRepository.findActiveByEmployee).toHaveBeenCalledWith(5)
    expect(sessionRepository.closeSession).toHaveBeenCalledWith(77, expect.any(Date))
  })

  it('skips closeSession when there is no active session but still audits', async () => {
    mocked(sessionRepository.findActiveByEmployee).mockResolvedValue(null)

    await authService.logout(5)

    expect(sessionRepository.closeSession).not.toHaveBeenCalled()
    expect(secureAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'LOGOUT' }))
  })

  it('propagates errors from the session repository', async () => {
    mocked(sessionRepository.findActiveByEmployee).mockRejectedValue(new Error('db down'))
    await expect(authService.logout(5)).rejects.toThrow('db down')
  })
})
