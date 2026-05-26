import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  try { requireAdmin(req) } catch (e) {
    return NextResponse.json({ message: (e as Error).message }, { status: 401 })
  }
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

  const include = { employee: { select: { id: true, firstName: true, lastName: true } } }

  function mapKpi(kpis: { employee: { id: number; firstName: string; lastName: string } }[]) {
    return kpis.map(k => ({
      ...k,
      employee: { ...k.employee, name: `${k.employee.firstName} ${k.employee.lastName}`.trim() },
    }))
  }

  if (pageSize > 0) {
    const [raw, total] = await Promise.all([
      prisma.employeeKPI.findMany({ skip: (page - 1) * pageSize, take: pageSize, where, include, orderBy: { date: 'desc' } }),
      prisma.employeeKPI.count({ where }),
    ])
    return NextResponse.json({ data: mapKpi(raw), total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  }

  const raw = await prisma.employeeKPI.findMany({ where, include, orderBy: { date: 'asc' } })
  return NextResponse.json({ data: mapKpi(raw), total: raw.length })
}
