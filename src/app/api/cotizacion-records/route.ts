import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req)
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
  const page     = Math.max(1, parseInt(searchParams.get('page')     ?? '1'))
  const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') ?? '10'))
  const source   = searchParams.get('source') ?? undefined

  const where = source ? { source } : {}

  const data = await prisma.cotizacionRecord.findMany({
    where,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      destinationLocation: {
        select: {
          name: true,
          type: true,
          parent: { select: { name: true, parent: { select: { name: true } } } },
        },
      },
      quotation: { select: { id: true, odooCustomerId: true, odooOrderName: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  const total = await prisma.cotizacionRecord.count({ where })

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
}

export async function PUT(req: NextRequest) {
  try { await requireAdmin(req) } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'No autorizado' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ message: 'id requerido' }, { status: 400 })

  try {
    const body = await req.json()
    const updated = await prisma.cotizacionRecord.update({
      where: { id },
      data: {
        ...(body.heightIn       !== undefined && { heightIn:       body.heightIn }),
        ...(body.widthIn        !== undefined && { widthIn:        body.widthIn }),
        ...(body.lengthIn       !== undefined && { lengthIn:       body.lengthIn }),
        ...(body.actualWeightLb !== undefined && { actualWeightLb: body.actualWeightLb }),
        ...(body.declaredValueUsd !== undefined && { declaredValueUsd: body.declaredValueUsd }),
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error interno' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try { await requireAdmin(req) } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'No autorizado' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ message: 'id requerido' }, { status: 400 })

  try {
    await prisma.cotizacionRecord.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error interno' }, { status: 400 })
  }
}
