import { prisma } from '@/lib/prisma'
import { UpdateContractInput } from '@/lib/validations/contracts'

export class ContractsService {
  async findAll(page: number, limit: number, search: string) {
    const where = search
        ? {
              OR: [
                  { employee: { firstName: { contains: search, mode: 'insensitive' as const } } },
                  { employee: { lastName:  { contains: search, mode: 'insensitive' as const } } },
                  { job:      { title:     { contains: search, mode: 'insensitive' as const } } },
              ],
          }
        : {}

    const [rawData, total] = await Promise.all([
        prisma.contract.findMany({
            where,
            include: {
                employee:     { select: { id: true, firstName: true, lastName: true, email: true } },
                job:          { select: { id: true, title: true } },
                contractType: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip:  (page - 1) * limit,
            take:  limit,
        }),
        prisma.contract.count({ where }),
    ])

    const data = rawData.map(c => ({
        ...c,
        employee: {
            ...c.employee,
            name: `${c.employee.firstName} ${c.employee.lastName}`.trim(),
        },
    }))

    return { data, total, page, limit }
  }

  async update(id: number, body: UpdateContractInput) {
    const updated = await prisma.contract.update({
        where: { id },
        data: {
            ...(body.salary     !== undefined && { salary:     body.salary }),
            ...(body.hourlyRate !== undefined && { hourlyRate: body.hourlyRate }),
            ...(body.endDate    !== undefined && { endDate:    body.endDate ? new Date(body.endDate) : null }),
            ...(body.isActive   !== undefined && { isActive:   body.isActive }),
        },
        include: {
            employee:     { select: { id: true, firstName: true, lastName: true } },
            job:          { select: { id: true, title: true } },
            contractType: { select: { id: true, name: true } },
        },
    })
    
    return {
        ...updated,
        employee: { 
            ...updated.employee, 
            name: `${updated.employee.firstName} ${updated.employee.lastName}`.trim() 
        },
    }
  }
}

export const contractsService = new ContractsService()
