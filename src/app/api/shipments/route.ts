import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page     = parseInt(searchParams.get('page')     ?? '1')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '0')

  const include = {
    status:   true,
    provider: true,
    events:   { orderBy: { createdAt: 'desc' as const }, take: 3 },
  }

  if (pageSize > 0) {
    const [data, total] = await Promise.all([
      prisma.shipment.findMany({ skip: (page-1)*pageSize, take: pageSize, include, orderBy: { createdAt: 'desc' } }),
      prisma.shipment.count(),
    ])
    return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total/pageSize) })
  }

  const data = await prisma.shipment.findMany({ include, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ data, total: data.length })
}
