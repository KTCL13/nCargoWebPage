/// <reference types="jest" />

// =====================================================================
// PRUEBAS DE ESCENARIOS INVÁLIDOS (deben pasar)
// ---------------------------------------------------------------------
// Verifican que el servicio de AUTH rechaza correctamente entradas
// inválidas y violaciones de reglas de negocio (campos vacíos, email
// duplicado, credenciales incorrectas, etc.). Todas deben terminar
// en "passed" porque afirman el mensaje/comportamiento real de error.
// =====================================================================

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
  hashService: { hash: jest.fn(), compare: jest.fn() },
}))

jest.mock('../jwt.service', () => ({
  jwtService: { sign: jest.fn(), verify: jest.fn() },
}))

jest.mock('@/lib/audit-logger', () => ({ auditLog: jest.fn() }))
jest.mock('@/lib/email', () => ({ sendPasswordResetEmail: jest.fn() }))

import { authService } from '../auth.service'
import { userRepository } from '../../repositories/user.repository'
import { roleRepository } from '../../repositories/role.repository'
import { hashService } from '../hash.service'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

describe('authService.register — escenarios inválidos', () => {
  const base = { name: 'Alice', email: 'a@b.c', password: 'pw', role: 'ADMIN' as const }

  it('rechaza cuando el nombre solo tiene espacios', async () => {
    await expect(authService.register({ ...base, name: '   ' })).rejects.toThrow('El nombre es obligatorio')
  })

  it('rechaza cuando el email está vacío', async () => {
    await expect(authService.register({ ...base, email: '' })).rejects.toThrow('El email es obligatorio')
  })

  it('rechaza cuando la contraseña solo tiene espacios', async () => {
    await expect(authService.register({ ...base, password: '   ' })).rejects.toThrow('La contraseña es obligatoria')
  })

  it('rechaza cuando el rol no viene en el payload', async () => {
    await expect(authService.register({ ...base, role: undefined as any })).rejects.toThrow('El rol es obligatorio')
  })

  it('rechaza cuando el email ya existe (no crea usuario nuevo)', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue({ id: 99, email: 'a@b.c' })
    await expect(authService.register(base)).rejects.toThrow('Ya existe un usuario con ese email')
    expect(userRepository.create).not.toHaveBeenCalled()
  })

  it('rechaza cuando el rol indicado no existe en la BD', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue(null)
    mocked(hashService.hash).mockResolvedValue('h')
    mocked(userRepository.create).mockResolvedValue({ id: 1, name: 'A', email: 'a@b.c' })
    mocked(roleRepository.findByName).mockResolvedValue(null)

    await expect(authService.register(base)).rejects.toThrow('El rol no existe')
    expect(roleRepository.assignRoleToEmployee).not.toHaveBeenCalled()
  })
})

describe('authService.login — escenarios inválidos', () => {
  const employee = {
    id: 1,
    name: 'A',
    email: 'a@b.c',
    passwordHash: 'stored-hash',
    employeeRoles: [{ role: { id: 2, name: 'ADMIN' } }],
  }

  it('rechaza con "Credenciales inválidas" cuando el usuario no existe', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue(null)
    await expect(authService.login({ email: 'a@b.c', password: 'pw' }, 'ip')).rejects.toThrow(
      'Credenciales inválidas',
    )
  })

  it('rechaza con "Credenciales inválidas" cuando la contraseña es incorrecta', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue(employee)
    mocked(hashService.compare).mockResolvedValue(false)
    await expect(authService.login({ email: 'a@b.c', password: 'bad' }, 'ip')).rejects.toThrow(
      'Credenciales inválidas',
    )
  })

  it('rechaza cuando el usuario existe pero no tiene passwordHash', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue({ ...employee, passwordHash: null })
    await expect(authService.login({ email: 'a@b.c', password: 'pw' }, 'ip')).rejects.toThrow(
      'Credenciales inválidas',
    )
  })

  it('rechaza cuando el usuario no tiene rol asignado', async () => {
    mocked(userRepository.findByEmail).mockResolvedValue({ ...employee, employeeRoles: [] })
    mocked(hashService.compare).mockResolvedValue(true)
    await expect(authService.login({ email: 'a@b.c', password: 'pw' }, 'ip')).rejects.toThrow(
      'El usuario no tiene rol asignado',
    )
  })
})
