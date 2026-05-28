import { NextRequest, NextResponse } from 'next/server'
import { getAuthEmployee } from '@/lib/auth-guard'
import { employeeService } from '@/modules/services/employee.service'
import { UpdateProfileSchema } from '@/lib/validations/employee'
import { z } from 'zod'

export async function GET(req: NextRequest) {
    try {
        const auth = await getAuthEmployee(req)
        const safeEmployee = await employeeService.getProfile(auth.id)
        return NextResponse.json(safeEmployee)
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'Empleado no encontrado') {
            return NextResponse.json({ message: error.message }, { status: 404 })
        }
        const status = error instanceof Error && error.message.includes('Token') ? 401 : 400
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error interno del servidor' },
            { status },
        )
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const auth = await getAuthEmployee(req)
        const body = await req.json()
        const validatedData = UpdateProfileSchema.parse(body)

        const result = await employeeService.updateProfile(auth.id, validatedData)
        return NextResponse.json(result)
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 })
        }
        const status = error instanceof Error && error.message.includes('Token') ? 401 : 400
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error interno del servidor' },
            { status },
        )
    }
}
