import { prisma } from '@/lib/prisma'
import { employeeRepository } from '../repositories/employee.repository'
import { contractRepository } from '../repositories/contract.repository'
import { jobHistoryRepository } from '../repositories/jobHistory.repository'
import { roleRepository } from '../repositories/role.repository'
import { PaginatedResponseDto } from '../dtos/paginated-response.dto'
import { EmployeeResponseDto } from '../dtos/employee-response.dto'
import { FilterEmployeeDto } from '../dtos/filter-employee.dto'
import { AssignRoleDto } from '../dtos/assign-role.dto'
import { CreateEmployeeDto } from '../dtos/create-employee.dto'
import { UpdateEmployeeDto } from '../dtos/update-employee.dto'
import { CreateContractDto } from '../dtos/create-contract.dto'
import { UpdateContractDto } from '../dtos/update-contract.dto'
import { hashService } from '../../auth/services/hash.service'
import { Employee, Contract, JobHistory } from '@prisma/client'
import { ContractResponseDto } from '../dtos/contract-response.dto'

class EmployeeService {
    private async toEmployeeResponseDto(employee: Employee): Promise<EmployeeResponseDto> {
        const roles = await roleRepository.getRolesByEmployeeId(employee.id)
        const contracts = await contractRepository.getContractsByEmployeeId(employee.id)
        const activeContract = contracts.find(contract => contract.isActive)

        return {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            status: employee.status,
            roles: roles.map(role => role.name),
            activeContract: activeContract ? await this.toContractResponseDto(activeContract) : null,
            createdAt: employee.createdAt,
        }
    }

    private async toContractResponseDto(contract: Contract): Promise<ContractResponseDto> {
        const [job, contractType] = await Promise.all([
            prisma.job.findUnique({ where: { id: contract.jobId } }),
            prisma.contractType.findUnique({ where: { id: contract.contractTypeId } }),
        ])

        return {
            id: contract.id,
            job: job ?? { id: contract.jobId, title: '—', description: null },
            contractType: contractType?.name ?? '—',
            salary: Number(contract.salary),
            hourlyRate: Number(contract.hourlyRate),
            startDate: contract.startDate,
            endDate: contract.endDate,
            isActive: contract.isActive,
        }
    }

    async findAll(filter: FilterEmployeeDto): Promise<PaginatedResponseDto> {
        const { employees, total } = await employeeRepository.getEmployees(filter)
        const employeeDtos = await Promise.all(employees.map(emp => this.toEmployeeResponseDto(emp)))
        return {
            data: employeeDtos,
            total,
            page: filter.page || 1,
            limit: filter.limit || 10,
        }
    }

    async findOne(id: number): Promise<EmployeeResponseDto> {
        const employee = await employeeRepository.getEmployeeById(id)

        if (!employee) {
            throw new Error(`Employee not found with id ${id}`)
        }

        return this.toEmployeeResponseDto(employee)
    }

    async create(data: CreateEmployeeDto) {
        const { name, email, password, status, roleIds, metadata } = data

        const passwordHash = await hashService.hash(password)

        const employee = await employeeRepository.create({
            name,
            email,
            passwordHash,
            status,
            metadata: metadata || {},
        })

        for (const roleId of roleIds) {
            await roleRepository.assignRoleToEmployee(employee.id, roleId)
        }

        return this.toEmployeeResponseDto(employee)
    }

    async update(id: number, data: UpdateEmployeeDto): Promise<EmployeeResponseDto> {
        const { roleIds, ...rest } = data
        const updatedEmployee = await employeeRepository.updateEmployee(id, rest)

        if (roleIds) {
            // Eliminar roles actuales y asignar los nuevos
            await prisma.employeeRole.deleteMany({ where: { employeeId: id } })
            for (const roleId of roleIds) {
                await roleRepository.assignRoleToEmployee(id, roleId)
            }
        }

        return this.toEmployeeResponseDto(updatedEmployee)
    }

    async remove(id: number): Promise<void> {
        await employeeRepository.deleteEmployee(id)
    }

    async getContracts(employeeId: number): Promise<ContractResponseDto[]> {
        const contracts = await contractRepository.getContractsByEmployeeId(employeeId)
        return Promise.all(contracts.map(contract => this.toContractResponseDto(contract)))
    }

    async findContractById(contractId: number): Promise<ContractResponseDto> {
        const contract = await contractRepository.findById(contractId)
        if (!contract) throw new Error(`Contract not found with id ${contractId}`)
        return this.toContractResponseDto(contract)
    }

    async createContract(employeeId: number, data: CreateContractDto): Promise<ContractResponseDto> {
        const newStartDate = new Date(data.startDate)

        const contract = await prisma.$transaction(async (tx) => {
            const previousEndDate = new Date(newStartDate)
            previousEndDate.setDate(previousEndDate.getDate() - 1)

            await tx.jobHistory.updateMany({
                where: { employeeId, endDate: null },
                data: { endDate: previousEndDate },
            })

            await tx.contract.updateMany({
                where: { employeeId, isActive: true },
                data: { isActive: false },
            })

            const newContract = await tx.contract.create({
                data: {
                    employeeId,
                    jobId: data.jobId,
                    contractTypeId: data.contractTypeId,
                    salary: data.salary,
                    hourlyRate: data.hourlyRate,
                    startDate: newStartDate,
                    endDate: data.endDate ? new Date(data.endDate) : null,
                    isActive: true,
                },
            })

            await tx.jobHistory.create({
                data: {
                    employeeId,
                    contractId: newContract.id,
                    jobId: newContract.jobId,
                    startDate: newContract.startDate,
                    endDate: null,
                },
            })

            return newContract
        })

        return this.toContractResponseDto(contract)
    }

    async updateContract(contractId: number, data: UpdateContractDto): Promise<ContractResponseDto> {
        const updateData = { ...data }
        if (data.endDate) {
            updateData.endDate = new Date(data.endDate)
        }
        const contract = await contractRepository.updateContract(contractId, updateData)
        return this.toContractResponseDto(contract)
    }

    async getJobHistory(employeeId: number): Promise<JobHistory[]> {
        const jobHistory = await jobHistoryRepository.getJobHistoryByEmployeeId(employeeId)
        return jobHistory
    }

    async assignRoles(employeeId: number, data: AssignRoleDto): Promise<EmployeeResponseDto> {
        const { roleIds } = data

        for (const roleId of roleIds) {
            await roleRepository.assignRoleToEmployee(employeeId, roleId)
        }

        const updatedEmployee = await employeeRepository.getEmployeeById(employeeId)

        if (!updatedEmployee) {
            throw new Error(`Employee not found with id ${employeeId}`)
        }

        return this.toEmployeeResponseDto(updatedEmployee)
    }
}

export const employeeService = new EmployeeService()