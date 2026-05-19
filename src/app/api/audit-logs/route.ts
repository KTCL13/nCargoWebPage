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
  const page       = parseInt(searchParams.get('page')     ?? '1')
  const pageSize   = parseInt(searchParams.get('pageSize') ?? '0')
  const entityType = searchParams.get('entity') ?? undefined

  const where = entityType ? { entityType } : {}
  const include = { employee: { select: { id: true, firstName: true, lastName: true } } }

  if (pageSize > 0) {
    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({ skip: (page-1)*pageSize, take: pageSize, where, include, orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.count({ where }),
    ])
    return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total/pageSize) })
  }

  const data = await prisma.auditLog.findMany({ where, include, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ data, total: data.length })
}
