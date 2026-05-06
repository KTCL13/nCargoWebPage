import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page       = parseInt(searchParams.get('page')     ?? '1')
  const pageSize   = parseInt(searchParams.get('pageSize') ?? '0')
  const employeeId = searchParams.get('employeeId')
  const range      = searchParams.get('range') // '7d' | '30d'
  const from       = searchParams.get('from')
  const to         = searchParams.get('to')

  const where: Prisma.EmployeeKPIWhereInput = {}
  if (employeeId) where.employeeId = parseInt(employeeId)

  if (range && range !== 'all') {
    const days = range === '30d' ? 30 : range === '90d' ? 90 : 7
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    cutoff.setHours(0, 0, 0, 0)
    where.date = { gte: cutoff }
  } else if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(to)   } : {}),
    }
  }

  const include = { employee: { select: { id: true, name: true } } }

  if (pageSize > 0) {
    const [data, total] = await Promise.all([
      prisma.employeeKPI.findMany({ skip: (page - 1) * pageSize, take: pageSize, where, include, orderBy: { date: 'desc' } }),
      prisma.employeeKPI.count({ where }),
    ])
    return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  }

  const data = await prisma.employeeKPI.findMany({ where, include, orderBy: { date: 'asc' } })
  return NextResponse.json({ data, total: data.length })
}
