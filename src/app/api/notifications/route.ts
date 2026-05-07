import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page     = parseInt(searchParams.get('page')     ?? '1')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '0')
  const unread   = searchParams.get('unread') === 'true'

  const where = unread ? { read: false } : {}
  const include = { employee: { select: { id: true, firstName: true, lastName: true } } }

  if (pageSize > 0) {
    const [data, total] = await Promise.all([
      prisma.notification.findMany({ skip: (page-1)*pageSize, take: pageSize, where, include, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
    ])
    return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total/pageSize) })
  }

  const data = await prisma.notification.findMany({ where, include, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ data, total: data.length })
}
