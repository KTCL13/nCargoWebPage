import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const page   = Math.max(1, Number(searchParams.get('page')  ?? '1'))
    const limit  = Math.max(1, Number(searchParams.get('limit') ?? '10'))
    const search = searchParams.get('search') ?? ''

    const where = search
        ? {
              OR: [
                  { employee: { name: { contains: search, mode: 'insensitive' as const } } },
                  { job:      { title: { contains: search, mode: 'insensitive' as const } } },
              ],
          }
        : {}

    const [data, total] = await Promise.all([
        prisma.contract.findMany({
            where,
            include: {
                employee:     { select: { id: true, name: true, email: true } },
                job:          { select: { id: true, title: true } },
                contractType: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip:  (page - 1) * limit,
            take:  limit,
        }),
        prisma.contract.count({ where }),
    ])

    return NextResponse.json({ data, total, page, limit })
}

export async function PUT(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id   = Number(searchParams.get('id'))
    const body = await req.json()

    try {
        const updated = await prisma.contract.update({
            where: { id },
            data: {
                ...(body.salary     !== undefined && { salary:     body.salary }),
                ...(body.hourlyRate !== undefined && { hourlyRate: body.hourlyRate }),
                ...(body.endDate    !== undefined && { endDate:    body.endDate ? new Date(body.endDate) : null }),
                ...(body.isActive   !== undefined && { isActive:   body.isActive }),
            },
            include: {
                employee:     { select: { id: true, name: true } },
                job:          { select: { id: true, title: true } },
                contractType: { select: { id: true, name: true } },
            },
        })
        return NextResponse.json(updated)
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error interno' },
            { status: 400 }
        )
    }
}
