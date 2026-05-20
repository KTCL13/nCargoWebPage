import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
  } catch (error) {
    const status =
      error instanceof Error && error.message.startsWith('Forbidden')
        ? 403
        : error instanceof Error && error.message.includes('Token')
          ? 401
          : 400
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No autorizado' },
      { status },
    )
  }

  const { searchParams } = new URL(req.url)
  const page     = Math.max(1, parseInt(searchParams.get('page')     ?? '1'))
  const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') ?? '10'))
  const source   = searchParams.get('source') ?? undefined

  const where = source ? { source } : {}

  const data = await prisma.cotizacionRecord.findMany({
    where,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      destinationLocation: {
        select: {
          name: true,
          type: true,
          parent: { select: { name: true, parent: { select: { name: true } } } },
        },
      },
      quotation: { select: { id: true, odooCustomerId: true, odooOrderName: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  const total = await prisma.cotizacionRecord.count({ where })

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
}
