import { NextRequest, NextResponse } from 'next/server'
import { employeeService } from '../services/employee.service'
import { CreateEmployeeDto } from '../dtos/create-employee.dto'
import { UpdateEmployeeDto } from '../dtos/update-employee.dto'
import { CreateContractDto } from '../dtos/create-contract.dto'
import { UpdateContractDto } from '../dtos/update-contract.dto'
import { FilterEmployeeDto } from '../dtos/filter-employee.dto'
import { AssignRoleDto } from '../dtos/assign-role.dto'
import { requireAdmin } from '@/lib/auth-guard'

function authErrorStatus(error: unknown): number {
    if (error instanceof Error) {
        if (error.message.includes('Token')) return 401
        if (error.message.startsWith('Forbidden')) return 403
    }
    return 400
}

function friendlyErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        if (error.message.includes('numeric field overflow') || error.message.includes('22003'))
            return 'El valor ingresado supera el límite permitido. Verifica que el salario o la tarifa estén dentro del rango válido.'
        return error.message
    }
    return 'Error interno del servidor'
}

class EmployeeController {
    // Obtener todos los empleados con filtros
    async findAll(req: NextRequest) {
        try {
            requireAdmin(req)
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'No autorizado' },
                { status: authErrorStatus(error) },
            )
        }
        const url = new URL(req.url)
        const minimal = url.searchParams.get('minimal') === 'true'
        const page = Number(url.searchParams.get('page') ?? '1')
        const limit = Number(url.searchParams.get('limit') ?? '10')
        const status = url.searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | null
        const roleId = url.searchParams.get('roleId')
        const jobId = url.searchParams.get('jobId')
        const search = url.searchParams.get('search')

        try {
            if (minimal) {
                const { employeeRepository } = await import('../repositories/employee.repository')
                const data = await employeeRepository.findMinimal({
                    status: status ?? undefined,
                    jobId: jobId ? Number(jobId) : undefined,
                    limit: limit ?? 500,
                })
                return NextResponse.json(data, { status: 200 })
            }

            const filter: FilterEmployeeDto = {
                status: status ?? undefined,
                roleId: roleId ? Number(roleId) : undefined,
                jobId: jobId ? Number(jobId) : undefined,
                search: search ?? undefined,
                page,
                limit,
            }
            const result = await employeeService.findAll(filter)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }

    // Obtener un solo empleado por ID
    async findOne(req: NextRequest) {
        try {
            requireAdmin(req)
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'No autorizado' },
                { status: authErrorStatus(error) },
            )
        }
        const url = new URL(req.url)
        const id = Number(url.searchParams.get('id'))

        try {
            const result = await employeeService.findOne(id)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }

    // Crear un nuevo empleado
    async create(req: NextRequest) {
        try {
            requireAdmin(req)
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'No autorizado' },
                { status: authErrorStatus(error) },
            )
        }
        const body: CreateEmployeeDto = await req.json()
        try {
            const result = await employeeService.create(body)
            return NextResponse.json(result, { status: 201 })
        } catch (error: unknown) {
            return NextResponse.json({ message: friendlyErrorMessage(error) }, { status: 400 })
        }
    }

    // Actualizar un empleado
    async update(req: NextRequest) {
        try {
            requireAdmin(req)
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'No autorizado' },
                { status: authErrorStatus(error) },
            )
        }
        const url = new URL(req.url)
        const id = Number(url.searchParams.get('id'))
        const body: UpdateEmployeeDto = await req.json()

        try {
            const result = await employeeService.update(id, body)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }

    // Eliminar un empleado
    async remove(req: NextRequest) {
        try {
            requireAdmin(req)
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'No autorizado' },
                { status: authErrorStatus(error) },
            )
        }
        const url = new URL(req.url)
        const id = Number(url.searchParams.get('id'))

        try {
            await employeeService.remove(id)
            return new NextResponse(null, { status: 204 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }

    // Obtener los contratos de un empleado
    async getContracts(req: NextRequest) {
        try {
            requireAdmin(req)
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'No autorizado' },
                { status: authErrorStatus(error) },
            )
        }
        const url = new URL(req.url)
        const employeeId = Number(url.searchParams.get('employeeId'))

        try {
            const result = await employeeService.getContracts(employeeId)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }

    // Obtener un contrato por ID
    async findContractById(req: NextRequest) {
        try {
            requireAdmin(req)
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'No autorizado' },
                { status: authErrorStatus(error) },
            )
        }
        const url = new URL(req.url)
        const contractId = Number(url.searchParams.get('contractId'))

        try {
            const result = await employeeService.findContractById(contractId)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }

    // Crear un contrato para un empleado
    async createContract(req: NextRequest) {
        try {
            requireAdmin(req)
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'No autorizado' },
                { status: authErrorStatus(error) },
            )
        }
        const url = new URL(req.url)
        const employeeId = Number(url.searchParams.get('employeeId'))
        const body: CreateContractDto = await req.json()

        try {
            const result = await employeeService.createContract(employeeId, body)
            return NextResponse.json(result, { status: 201 })
        } catch (error: unknown) {
            return NextResponse.json({ message: friendlyErrorMessage(error) }, { status: 400 })
        }
    }

    // Actualizar un contrato de un empleado
    async updateContract(req: NextRequest) {
        try {
            requireAdmin(req)
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'No autorizado' },
                { status: authErrorStatus(error) },
            )
        }
        const url = new URL(req.url)
        const contractId = Number(url.searchParams.get('contractId'))
        const body: UpdateContractDto = await req.json()

        try {
            const result = await employeeService.updateContract(contractId, body)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json({ message: friendlyErrorMessage(error) }, { status: 400 })
        }
    }

    // Verificar duplicados de email/teléfono antes de guardar
    async checkDuplicates(req: NextRequest) {
        try {
            requireAdmin(req)
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'No autorizado' },
                { status: authErrorStatus(error) },
            )
        }
        const url = new URL(req.url)
        const email = url.searchParams.get('email') ?? ''
        const phone = url.searchParams.get('phone') ?? ''
        const excludeId = url.searchParams.get('excludeId')

        try {
            const result = await employeeService.checkDuplicates(
                email,
                phone,
                excludeId ? Number(excludeId) : undefined,
            )
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }

    // Asignar roles a un empleado
    async assignRoles(req: NextRequest) {
        try {
            requireAdmin(req)
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'No autorizado' },
                { status: authErrorStatus(error) },
            )
        }
        const url = new URL(req.url)
        const id = Number(url.searchParams.get('id'))
        const body: AssignRoleDto = await req.json()

        try {
            const result = await employeeService.assignRoles(id, body)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }
}

export const employeeController = new EmployeeController()