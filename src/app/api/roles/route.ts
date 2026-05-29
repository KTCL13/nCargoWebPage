import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthEmployee } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
    try { getAuthEmployee(req) } catch (e) {
        return NextResponse.json({ message: (e as Error).message }, { status: 401 })
    }
    const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(roles)
}
