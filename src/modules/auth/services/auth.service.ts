import { userRepository } from '../repositories/user.repository'
import { roleRepository } from '../repositories/role.repository'
import { sessionRepository } from '../repositories/session.repository'
import { passwordResetRepository } from '../repositories/password-reset.repository'
import { hashService } from './hash.service'
import { jwtService } from './jwt.service'
import { auditLog } from '@/lib/audit-logger'
import { sendPasswordResetEmail } from '@/lib/email'
import { AuthResponseDto, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, RoleType } from '../dtos/auth.types'

const DEFAULT_ID_TYPE_CODE = 'CC'

class AuthService {
    async register(data: RegisterDto): Promise<AuthResponseDto> {
        const firstName = data.firstName?.trim()
        const lastName  = data.lastName?.trim()
        const email     = data.email?.trim().toLowerCase()
        const password  = data.password?.trim()
        const roleName  = data.role

        if (!firstName) throw new Error('El nombre es obligatorio')
        if (!lastName)  throw new Error('El apellido es obligatorio')
        if (!email)     throw new Error('El email es obligatorio')
        if (!password)  throw new Error('La contraseña es obligatoria')
        if (!roleName)  throw new Error('El rol es obligatorio')

        const existingUser = await userRepository.findByEmail(email)
        if (existingUser) throw new Error('Ya existe un usuario con ese email')

        // Resolve identification type
        let identificationTypeId = data.identificationTypeId
        if (!identificationTypeId) {
            const defaultType = await roleRepository.findIdentificationTypeByCode(DEFAULT_ID_TYPE_CODE)
            if (!defaultType) throw new Error('Tipo de identificación por defecto no encontrado')
            identificationTypeId = defaultType.id
        }

        const passwordHash = await hashService.hash(password)
        const employee = await userRepository.create({
            firstName,
            lastName,
            identificationNumber: data.identificationNumber ?? '',
            identificationTypeId,
            email,
            passwordHash,
        })

        const role = await roleRepository.findByName(roleName)
        if (!role) throw new Error('El rol no existe')

        await roleRepository.assignRoleToEmployee(employee.id, role.id)

        const accessToken = jwtService.sign({ id: employee.id, email: employee.email, role: role.name })
        const name = `${employee.firstName} ${employee.lastName}`.trim()

        return { accessToken, role: role.name as RoleType, email: employee.email, name }
    }

    async login(data: LoginDto, ip: string, userAgent?: string): Promise<AuthResponseDto> {
        const email    = data.email?.trim().toLowerCase()
        const password = data.password?.trim()

        if (!email)    throw new Error('El email es obligatorio')
        if (!password) throw new Error('La contraseña es obligatoria')

        const employee = await userRepository.findByEmail(email)
        if (!employee || !employee.passwordHash) throw new Error('Credenciales inválidas')

        const isValidPassword = await hashService.compare(password, employee.passwordHash)
        if (!isValidPassword) throw new Error('Credenciales inválidas')

        if (employee.status === 'INACTIVE') {
            throw new Error('Tu cuenta está inactiva. Contacta al administrador.')
        }

        const role = employee.employeeRoles[0]?.role
        if (!role) throw new Error('El usuario no tiene rol asignado')

        await sessionRepository.create({
            employeeId: employee.id,
            ipAddress: ip,
            deviceInfo: userAgent ? { userAgent } : undefined,
        })

        await auditLog({
            entityType: 'UserSession',
            entityId: employee.id,
            action: 'LOGIN',
            performedBy: employee.id,
            newValues: { ip },
        })

        const accessToken = jwtService.sign({ id: employee.id, email: employee.email, role: role.name })
        const name = `${employee.firstName} ${employee.lastName}`.trim()

        return { accessToken, role: role.name as RoleType, email: employee.email, name }
    }

    async logout(employeeId: number): Promise<void> {
        const session = await sessionRepository.findActiveByEmployee(employeeId)
        if (session) {
            await sessionRepository.closeSession(session.id, new Date())
        }

        await auditLog({
            entityType: 'UserSession',
            entityId: employeeId,
            action: 'LOGOUT',
            performedBy: employeeId,
        })
    }

    async forgotPassword(data: ForgotPasswordDto): Promise<void> {
        const email = data.email?.trim().toLowerCase()
        if (!email) throw new Error('El email es obligatorio')

        const employee = await userRepository.findByEmail(email)
        if (!employee) return

        const { token } = await passwordResetRepository.create(employee.id)
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`
        await sendPasswordResetEmail(employee.email, resetUrl)
    }

    async resetPassword(data: ResetPasswordDto): Promise<void> {
        if (!data.token)    throw new Error('Token inválido')
        if (!data.password) throw new Error('La contraseña es obligatoria')

        const record = await passwordResetRepository.findValid(data.token)
        if (!record) throw new Error('El enlace ha expirado o ya fue usado')

        const passwordHash = await hashService.hash(data.password)
        await userRepository.updatePassword(record.employeeId, passwordHash)
        await passwordResetRepository.markUsed(record.id)
    }
}

export const authService = new AuthService()
