import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page       = parseInt(searchParams.get('page')     ?? '1')
  const pageSize   = parseInt(searchParams.get('pageSize') ?? '0')
  const employeeId = searchParams.get('employeeId')

  const where = employeeId ? { employeeId: parseInt(employeeId) } : {}
  const include = { employee: { select: { id: true, name: true } } }

  if (pageSize > 0) {
    const [data, total] = await Promise.all([
      prisma.employeeKPI.findMany({ skip: (page-1)*pageSize, take: pageSize, where, include, orderBy: { date: 'desc' } }),
      prisma.employeeKPI.count({ where }),
    ])
    return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total/pageSize) })
  }

  const data = await prisma.employeeKPI.findMany({ where, include, orderBy: { date: 'desc' } })
  return NextResponse.json({ data, total: data.length })
}
