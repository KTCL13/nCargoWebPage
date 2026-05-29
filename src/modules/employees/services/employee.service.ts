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
import { JobHistory } from '@prisma/client'
import { ContractResponseDto } from '../dtos/contract-response.dto'
import { fullName, toContractResponseDto, toEmployeeResponseDto } from './employee-mapper'
import { assertValidEmail, assertValidPassword, validateContractRates } from './employee-validator'

export { fullName }

class EmployeeService {
    async findAll(filter: FilterEmployeeDto): Promise<PaginatedResponseDto> {
        const { employees, total } = await employeeRepository.getEmployees(filter)
        const employeeDtos = await Promise.all(employees.map(emp => toEmployeeResponseDto(emp)))
        return {
            data: employeeDtos,
            total,
            page: filter.page || 1,
            limit: filter.limit || 10,
        }
    }

    async findOne(id: number): Promise<EmployeeResponseDto> {
        const employee = await employeeRepository.getEmployeeById(id)
        if (!employee) throw new Error(`Employee not found with id ${id}`)
        return toEmployeeResponseDto(employee)
    }

    async checkDuplicates(email: string, phone: string, excludeId?: number): Promise<{ emailOwner?: string; phoneOwner?: string }> {
        const [emailEmp, phoneEmp] = await Promise.all([
            email ? employeeRepository.findByEmailExcluding(email, excludeId) : null,
            phone ? employeeRepository.findByPhone(phone, excludeId) : null,
        ])
        return {
            emailOwner: emailEmp ? fullName(emailEmp) : undefined,
            phoneOwner: phoneEmp ? fullName(phoneEmp) : undefined,
        }
    }

    async create(data: CreateEmployeeDto) {
        const { firstName, lastName, identificationNumber, identificationTypeId, email, password, status, roleIds, metadata, initialContract } = data

        if (!firstName?.trim()) throw new Error('El nombre es obligatorio')
        if (!lastName?.trim()) throw new Error('El apellido es obligatorio')
        if (!identificationNumber?.trim()) throw new Error('El número de identificación es obligatorio')
        if (!identificationTypeId) throw new Error('El tipo de identificación es obligatorio')
        assertValidEmail(email)
        const normalizedEmail = email.trim().toLowerCase()

        const existing = await employeeRepository.findByIdentification(identificationTypeId, identificationNumber.trim())
        if (existing) {
            const idType = existing.identificationType?.name ?? 'documento'
            throw new Error(`Ya existe un empleado con el mismo número de ${idType}: ${identificationNumber.trim()}`)
        }

        const emailExists = await employeeRepository.findByEmailExcluding(normalizedEmail)
        if (emailExists) {
            throw new Error(`El correo electrónico "${normalizedEmail}" ya está registrado por otro empleado`)
        }

        assertValidPassword(password)

        if (initialContract) {
            await validateContractRates(initialContract.contractTypeId, initialContract.salary, initialContract.hourlyRate)
        }

        const passwordHash = await hashService.hash(password)

        // Create employee + roles + initial contract in a single transaction
        const employee = await prisma.$transaction(async (tx) => {
            const emp = await tx.employee.create({
                data: {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    identificationNumber: identificationNumber.trim(),
                    identificationTypeId,
                    email: normalizedEmail,
                    passwordHash,
                    status,
                    metadata: metadata ?? {},
                },
                include: { identificationType: true },
            })

            for (const roleId of roleIds) {
                await tx.employeeRole.create({ data: { employeeId: emp.id, roleId } })
            }

            if (initialContract) {
                const startDate = new Date(initialContract.startDate)
                const newContract = await tx.contract.create({
                    data: {
                        employeeId: emp.id,
                        jobId: initialContract.jobId,
                        contractTypeId: initialContract.contractTypeId,
                        salary: initialContract.salary || null,
                        hourlyRate: initialContract.hourlyRate || null,
                        startDate,
                        endDate: initialContract.endDate ? new Date(initialContract.endDate) : null,
                        isActive: true,
                    },
                })

                await tx.jobHistory.create({
                    data: {
                        employeeId: emp.id,
                        contractId: newContract.id,
                        startDate: newContract.startDate,
                        endDate: null,
                    },
                })
            }

            return emp
        })

        return toEmployeeResponseDto(employee)
    }

    async update(id: number, data: UpdateEmployeeDto): Promise<EmployeeResponseDto> {
        const { roleIds, password, ...rest } = data
        if (rest.email !== undefined && rest.email !== '') assertValidEmail(rest.email)
        const repoData: Parameters<typeof employeeRepository.updateEmployee>[1] = {
            ...rest,
            ...(rest.email && { email: rest.email.trim().toLowerCase() }),
        }
        if (password) {
            repoData.passwordHash = await hashService.hash(password)
        }
        const updatedEmployee = await employeeRepository.updateEmployee(id, repoData)

        if (rest.status === 'INACTIVE') {
            const today = new Date()
            await prisma.contract.updateMany({
                where: { employeeId: id, isActive: true },
                data: { isActive: false, endDate: today },
            })
            await prisma.jobHistory.updateMany({
                where: { employeeId: id, endDate: null },
                data: { endDate: today },
            })
        }

        if (roleIds) {
            await prisma.employeeRole.deleteMany({ where: { employeeId: id } })
            for (const roleId of roleIds) {
                await roleRepository.assignRoleToEmployee(id, roleId)
            }
        }

        return toEmployeeResponseDto(updatedEmployee)
    }

    async remove(id: number): Promise<void> {
        const today = new Date()
        await prisma.$transaction([
            prisma.contract.updateMany({
                where: { employeeId: id, isActive: true },
                data: { isActive: false, endDate: today },
            }),
            prisma.jobHistory.updateMany({
                where: { employeeId: id, endDate: null },
                data: { endDate: today },
            }),
        ])
        await employeeRepository.deleteEmployee(id)
    }

    async getContracts(employeeId: number): Promise<ContractResponseDto[]> {
        const contracts = await contractRepository.getContractsByEmployeeId(employeeId)
        return Promise.all(contracts.map(contract => toContractResponseDto(contract)))
    }

    async findContractById(contractId: number): Promise<ContractResponseDto> {
        const contract = await contractRepository.findById(contractId)
        if (!contract) throw new Error(`Contract not found with id ${contractId}`)
        return toContractResponseDto(contract)
    }

    async createContract(employeeId: number, data: CreateContractDto): Promise<ContractResponseDto> {
        await validateContractRates(data.contractTypeId, data.salary, data.hourlyRate)

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
                data: { isActive: false, endDate: previousEndDate },
            })

            const newContract = await tx.contract.create({
                data: {
                    employeeId,
                    jobId: data.jobId,
                    contractTypeId: data.contractTypeId,
                    salary: data.salary || null,
                    hourlyRate: data.hourlyRate || null,
                    startDate: newStartDate,
                    endDate: data.endDate ? new Date(data.endDate) : null,
                    isActive: true,
                },
            })

            await tx.jobHistory.create({
                data: {
                    employeeId,
                    contractId: newContract.id,
                    startDate: newContract.startDate,
                    endDate: null,
                },
            })

            return newContract
        })

        return toContractResponseDto(contract)
    }

    async updateContract(contractId: number, data: UpdateContractDto): Promise<ContractResponseDto> {
        if (data.salary !== undefined && data.salary > 9_999_999_999.99)
            throw new Error(`El salario no puede superar $${(9_999_999_999.99).toLocaleString('es-CO')}`)
        if (data.hourlyRate !== undefined && data.hourlyRate > 99_999_999.99)
            throw new Error(`La tarifa por hora no puede superar $${(99_999_999.99).toLocaleString('es-CO')}/h`)
        const updateData = { ...data }
        if (data.endDate) {
            updateData.endDate = new Date(data.endDate)
        }
        const contract = await contractRepository.updateContract(contractId, updateData)
        return toContractResponseDto(contract)
    }

    async getJobHistory(employeeId: number): Promise<JobHistory[]> {
        return jobHistoryRepository.getJobHistoryByEmployeeId(employeeId)
    }

    async assignRoles(employeeId: number, data: AssignRoleDto): Promise<EmployeeResponseDto> {
        const { roleIds } = data

        for (const roleId of roleIds) {
            await roleRepository.assignRoleToEmployee(employeeId, roleId)
        }

        const updatedEmployee = await employeeRepository.getEmployeeById(employeeId)
        if (!updatedEmployee) throw new Error(`Employee not found with id ${employeeId}`)

        return toEmployeeResponseDto(updatedEmployee)
    }
}

export const employeeService = new EmployeeService()
