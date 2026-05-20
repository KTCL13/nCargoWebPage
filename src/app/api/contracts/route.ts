import { NextRequest, NextResponse } from 'next/server'
import { contractsService } from '@/modules/services/contracts.service'
import { UpdateContractSchema } from '@/lib/validations/contracts'
import { requireAdmin } from '@/lib/auth-guard'
import { z } from 'zod'

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
    try {
        requireAdmin(req)
    } catch (error) {
        return authErrorResponse(error)
    }

    const { searchParams } = new URL(req.url)
    const page   = Math.max(1, Number(searchParams.get('page')  ?? '1'))
    const limit  = Math.max(1, Number(searchParams.get('limit') ?? '10'))
    const search = searchParams.get('search') ?? ''

    const result = await contractsService.findAll(page, limit, search)
    return NextResponse.json(result)
}

export async function PUT(req: NextRequest) {
    try {
        requireAdmin(req)
    } catch (error) {
        return authErrorResponse(error)
    }

    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))

    if (!id) return NextResponse.json({ message: 'id requerido' }, { status: 400 })

    try {
        const body = await req.json()
        const validatedData = UpdateContractSchema.parse(body)

        const result = await contractsService.update(id, validatedData)
        return NextResponse.json(result)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 })
        }
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error interno' },
            { status: 400 }
        )
    }
}
