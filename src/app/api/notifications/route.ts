import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthEmployee } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  try {
    const me = getAuthEmployee(req)
    const { searchParams } = new URL(req.url)
    const page     = parseInt(searchParams.get('page')     ?? '1')
    const pageSize = parseInt(searchParams.get('pageSize') ?? '0')
    const unread   = searchParams.get('unread') === 'true'

    const where = { employeeId: me.id, ...(unread ? { read: false } : {}) }

    if (pageSize > 0) {
      const [data, total] = await Promise.all([
        prisma.notification.findMany({ skip: (page-1)*pageSize, take: pageSize, where, orderBy: { createdAt: 'desc' } }),
        prisma.notification.count({ where }),
      ])
      return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total/pageSize) })
    }

    const data = await prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ data, total: data.length })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error interno' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const me   = getAuthEmployee(req)
    const body = await req.json()

    if (body.all) {
      await prisma.notification.updateMany({ where: { employeeId: me.id, read: false }, data: { read: true } })
    } else if (body.id) {
      await prisma.notification.updateMany({ where: { id: body.id, employeeId: me.id }, data: { read: true } })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error interno' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const me = getAuthEmployee(req)
    const id = parseInt(new URL(req.url).searchParams.get('id') ?? '0')
    if (!id) return NextResponse.json({ message: 'id requerido' }, { status: 400 })

    await prisma.notification.deleteMany({ where: { id, employeeId: me.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error interno' }, { status: 400 })
  }
}
