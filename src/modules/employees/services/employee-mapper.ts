import { prisma } from '@/lib/prisma'
import { roleRepository } from '../repositories/role.repository'
import { contractRepository } from '../repositories/contract.repository'
import { Employee, Contract, IdentificationType } from '@prisma/client'
import { EmployeeResponseDto } from '../dtos/employee-response.dto'
import { ContractResponseDto } from '../dtos/contract-response.dto'

type EmployeeWithIdType = Employee & { identificationType: IdentificationType }

export function fullName(emp: { firstName: string; lastName: string }): string {
    return `${emp.firstName} ${emp.lastName}`.trim()
}

export async function toContractResponseDto(contract: Contract): Promise<ContractResponseDto> {
    const [job, contractType] = await Promise.all([
        prisma.job.findUnique({ where: { id: contract.jobId } }),
        prisma.contractType.findUnique({ where: { id: contract.contractTypeId } }),
    ])

    return {
        id: contract.id,
        job: job ?? { id: contract.jobId, title: '—', description: null },
        contractType: contractType ?? { id: contract.contractTypeId, name: '—' },
        salary: Number(contract.salary),
        hourlyRate: Number(contract.hourlyRate),
        startDate: contract.startDate,
        endDate: contract.endDate,
        isActive: contract.isActive,
    }
}

export async function toEmployeeResponseDto(employee: EmployeeWithIdType): Promise<EmployeeResponseDto> {
    const roles = await roleRepository.getRolesByEmployeeId(employee.id)
    const contracts = await contractRepository.getContractsByEmployeeId(employee.id)
    const activeContract = contracts.find(contract => contract.isActive)

    return {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        name: fullName(employee),
        identificationNumber: employee.identificationNumber,
        identificationType: {
            id: employee.identificationType.id,
            code: employee.identificationType.code,
            name: employee.identificationType.name,
        },
        email: employee.email,
        status: employee.status,
        roles: roles.map(role => role.name),
        activeContract: activeContract ? await toContractResponseDto(activeContract) : null,
        createdAt: employee.createdAt,
    }
}
