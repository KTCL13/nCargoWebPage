import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') ?? '0')
    const { action } = await req.json()

    if (!id || !action) {
      return NextResponse.json({ message: 'id y action requeridos' }, { status: 400 })
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: { events: { orderBy: { timestamp: 'asc' } } },
    })

    if (!attendance) {
      return NextResponse.json({ message: 'Registro no encontrado' }, { status: 404 })
    }

    const now = new Date()

    if (action === 'pause') {
      const updated = await prisma.attendance.update({
        where: { id },
        data: {
          status: 'PAUSED',
          events: { create: { type: 'PAUSE', timestamp: now } },
        },
        include: {
          employee: { select: { id: true, name: true } },
          events: { orderBy: { timestamp: 'asc' } },
          tasks: { select: { id: true, title: true, minutesSpent: true } },
        },
      })
      return NextResponse.json(updated)
    }

    if (action === 'resume') {
      const updated = await prisma.attendance.update({
        where: { id },
        data: {
          status: 'OPEN',
          events: { create: { type: 'RESUME', timestamp: now } },
        },
        include: {
          employee: { select: { id: true, name: true } },
          events: { orderBy: { timestamp: 'asc' } },
          tasks: { select: { id: true, title: true, minutesSpent: true } },
        },
      })
      return NextResponse.json(updated)
    }

    if (action === 'stop') {
      // Calculate worked hours from events (sum of active intervals)
      const allEvents = [...attendance.events, { type: 'CLOCK_OUT' as const, timestamp: now }]
      let workedMs = 0
      let lastClockIn: Date | null = null

      for (const ev of allEvents) {
        if (ev.type === 'CLOCK_IN' || ev.type === 'RESUME') {
          lastClockIn = ev.timestamp
        } else if ((ev.type === 'PAUSE' || ev.type === 'CLOCK_OUT') && lastClockIn) {
          workedMs += ev.timestamp.getTime() - lastClockIn.getTime()
          lastClockIn = null
        }
      }

      const workedHours = parseFloat((workedMs / 3_600_000).toFixed(2))

      const updated = await prisma.attendance.update({
        where: { id },
        data: {
          status: 'CLOSED',
          endedAt: now,
          workedHours,
          events: { create: { type: 'CLOCK_OUT', timestamp: now } },
        },
        include: {
          employee: { select: { id: true, name: true } },
          events: { orderBy: { timestamp: 'asc' } },
          tasks: { select: { id: true, title: true, minutesSpent: true } },
        },
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ message: 'action inválido' }, { status: 400 })
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
