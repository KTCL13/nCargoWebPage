import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  try { requireAdmin(req) } catch (e) {
    return NextResponse.json({ message: (e as Error).message }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const page     = parseInt(searchParams.get('page')     ?? '1')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '0')

  const include = {
    originOffice: true,
    employee:     { select: { id: true, firstName: true, lastName: true, email: true } },
  }

  if (pageSize > 0) {
    const [data, total] = await Promise.all([
      prisma.quotation.findMany({ skip: (page-1)*pageSize, take: pageSize, include, orderBy: { createdAt: 'desc' } }),
      prisma.quotation.count(),
    ])
    return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total/pageSize) })
  }

  const data = await prisma.quotation.findMany({ include, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ data, total: data.length })
}
