import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const data = await prisma.systemConfig.findMany({ orderBy: { key: 'asc' } })
  return NextResponse.json({ data, total: data.length })
}

export async function PUT(req: NextRequest) {
  try {
    const body: { key: string; value: string }[] = await req.json()
    if (!Array.isArray(body)) {
      return NextResponse.json({ message: 'Expected an array of { key, value }' }, { status: 400 })
    }
    await Promise.all(
      body.map(({ key, value }) =>
        prisma.systemConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 },
    )
  }
}
