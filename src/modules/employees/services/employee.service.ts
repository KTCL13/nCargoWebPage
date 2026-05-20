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
import { Employee, Contract, JobHistory, IdentificationType } from '@prisma/client'
import { ContractResponseDto } from '../dtos/contract-response.dto'

type EmployeeWithIdType = Employee & { identificationType: IdentificationType }

export function fullName(emp: { firstName: string; lastName: string }): string {
    return `${emp.firstName} ${emp.lastName}`.trim()
}

class EmployeeService {
    private async toEmployeeResponseDto(employee: EmployeeWithIdType): Promise<EmployeeResponseDto> {
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
            contractType: contractType ?? { id: contract.contractTypeId, name: '—' },
            salary: Number(contract.salary),
            hourlyRate: Number(contract.hourlyRate),
            startDate: contract.startDate,
            endDate: contract.endDate,
            isActive: contract.isActive,
        }
    }

    // Validates salary/hourlyRate against SystemConfig thresholds based on contract type.
    // Monthly contracts check salary against SMLV; hourly contracts check hourlyRate against min_hourly_rate.
    private async validateContractRates(contractTypeId: number, salary: number, hourlyRate: number): Promise<void> {
        const [smlvCfg, minHourlyCfg, contractType] = await Promise.all([
            prisma.systemConfig.findUnique({ where: { key: 'smlv' } }),
            prisma.systemConfig.findUnique({ where: { key: 'min_hourly_rate' } }),
            prisma.contractType.findUnique({ where: { id: contractTypeId } }),
        ])

        const isHourly = contractType?.name?.toUpperCase().includes('HORA') ?? false

        if (!isHourly && smlvCfg) {
            const smlv = Number(smlvCfg.value)
            if (salary < smlv)
                throw new Error(`El salario no puede ser menor al SMLV ($${smlv.toLocaleString('es-CO')})`)
        }
        if (isHourly && minHourlyCfg) {
            const minRate = Number(minHourlyCfg.value)
            if (hourlyRate < minRate)
                throw new Error(`La tarifa por hora no puede ser menor al mínimo legal ($${minRate.toLocaleString('es-CO')}/h)`)
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

        const existing = await employeeRepository.findByIdentification(identificationTypeId, identificationNumber.trim())
        if (existing) {
            const idType = existing.identificationType?.name ?? 'documento'
            throw new Error(`Ya existe un empleado con el mismo número de ${idType}: ${identificationNumber.trim()}`)
        }

        const emailExists = await employeeRepository.findByEmailExcluding(email)
        if (emailExists) {
            throw new Error(`El correo electrónico "${email}" ya está registrado por otro empleado`)
        }

        if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password))
            throw new Error('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número')

        // Validate contract rates BEFORE any DB write so we fail early with no side effects
        if (initialContract) {
            await this.validateContractRates(initialContract.contractTypeId, initialContract.salary, initialContract.hourlyRate)
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
                    email,
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
                        salary: initialContract.salary,
                        hourlyRate: initialContract.hourlyRate,
                        startDate,
                        endDate: initialContract.endDate ? new Date(initialContract.endDate) : null,
                        isActive: true,
                    },
                })

                await tx.jobHistory.create({
                    data: {
                        employeeId: emp.id,
                        contractId: newContract.id,
                        jobId: newContract.jobId,
                        startDate: newContract.startDate,
                        endDate: null,
                    },
                })
            }

            return emp
        })

        return this.toEmployeeResponseDto(employee)
    }

    async update(id: number, data: UpdateEmployeeDto): Promise<EmployeeResponseDto> {
        const { roleIds, password, ...rest } = data
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

        return this.toEmployeeResponseDto(updatedEmployee)
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
        return Promise.all(contracts.map(contract => this.toContractResponseDto(contract)))
    }

    async findContractById(contractId: number): Promise<ContractResponseDto> {
        const contract = await contractRepository.findById(contractId)
        if (!contract) throw new Error(`Contract not found with id ${contractId}`)
        return this.toContractResponseDto(contract)
    }

    async createContract(employeeId: number, data: CreateContractDto): Promise<ContractResponseDto> {
        await this.validateContractRates(data.contractTypeId, data.salary, data.hourlyRate)

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
