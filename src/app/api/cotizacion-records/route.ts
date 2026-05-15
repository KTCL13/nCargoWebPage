import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
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
