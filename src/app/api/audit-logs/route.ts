import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page       = parseInt(searchParams.get('page')     ?? '1')
  const pageSize   = parseInt(searchParams.get('pageSize') ?? '0')
  const entityType = searchParams.get('entity') ?? undefined

  const where = entityType ? { entityType } : {}
  const include = { employee: { select: { id: true, firstName: true, lastName: true } } }

  const toNamed = (raw: { employee: { id: number; firstName: string; lastName: string } | null; [k: string]: unknown }[]) =>
    raw.map(r => ({ ...r, employee: r.employee ? { ...r.employee, name: `${r.employee.firstName} ${r.employee.lastName}`.trim() } : null }))

  if (pageSize > 0) {
    const [raw, total] = await Promise.all([
      prisma.auditLog.findMany({ skip: (page-1)*pageSize, take: pageSize, where, include, orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.count({ where }),
    ])
    return NextResponse.json({ data: toNamed(raw), total, page, pageSize, totalPages: Math.ceil(total/pageSize) })
  }

  const raw = await prisma.auditLog.findMany({ where, include, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ data: toNamed(raw), total: raw.length })
}
