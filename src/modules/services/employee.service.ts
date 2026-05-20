import { prisma } from '@/lib/prisma'
import { UpdateProfileInput } from '@/lib/validations/employee'

export class EmployeeService {
  async getProfile(employeeId: number) {
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
            identificationType: true,
            contracts: {
                where: { isActive: true },
                include: { job: true },
                take: 1
            }
        }
    })

    if (!employee) {
        throw new Error('Empleado no encontrado')
    }

    const { passwordHash, ...safeEmployee } = employee
    return safeEmployee
  }

  async updateProfile(employeeId: number, data: UpdateProfileInput) {
    await prisma.employee.update({
        where: { id: employeeId },
        data,
    })
    return { message: 'Perfil actualizado' }
  }
}

export const employeeService = new EmployeeService()
