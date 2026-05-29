import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthEmployee } from '@/lib/auth-guard'

function authErrorResponse(error: unknown) {
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

export async function GET(req: NextRequest) {
  let employee: Awaited<ReturnType<typeof getAuthEmployee>>
  try {
    employee = await getAuthEmployee(req)
  } catch (error) {
    return authErrorResponse(error)
  }

  const { searchParams } = new URL(req.url)
  const page     = parseInt(searchParams.get('page')     ?? '1')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '0')

  const include = {
    originOffice: true,
    employee:     { select: { id: true, firstName: true, lastName: true, email: true } },
  }

  const where = employee.role === 'ADMIN' ? {} : { employeeId: employee.id }

  if (pageSize > 0) {
    const [data, total] = await Promise.all([
      prisma.quotation.findMany({ where, skip: (page-1)*pageSize, take: pageSize, include, orderBy: { createdAt: 'desc' } }),
      prisma.quotation.count({ where }),
    ])
    return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total/pageSize) })
  }

  const data = await prisma.quotation.findMany({ where, include, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ data, total: data.length })
}
