import { NextRequest, NextResponse } from 'next/server'
import { quotationService } from '../services/quotation.service'
import { SimpleCalculatorDto } from '../dtos/simple-calculator.dto'

const REQUIRED_FIELDS = ['city', 'weight', 'height', 'width', 'length', 'declaredValue'] as const

function parseSimpleCalculatorBody(body: unknown): SimpleCalculatorDto {
    if (!body || typeof body !== 'object') throw new Error('Body inválido')
    const raw = body as Record<string, unknown>

    for (const field of REQUIRED_FIELDS) {
        if (raw[field] === undefined || raw[field] === null || raw[field] === '') {
            throw new Error(`Campo obligatorio faltante: ${field}`)
        }
    }

    const numeric = (key: string): number => {
        const value = Number(raw[key])
        if (!Number.isFinite(value)) throw new Error(`Campo "${key}" debe ser numérico`)
        return value
    }

    return {
        city: String(raw.city).trim(),
        weight: numeric('weight'),
        height: numeric('height'),
        width: numeric('width'),
        length: numeric('length'),
        declaredValue: numeric('declaredValue'),
        employeeId: raw.employeeId !== undefined ? Number(raw.employeeId) : undefined,
        odooCustomerId: raw.odooCustomerId !== undefined ? Number(raw.odooCustomerId) : undefined,
    }
}

class QuotationController {
    async calculateSimple(req: NextRequest) {
        try {
            const dto = parseSimpleCalculatorBody(await req.json())
            const result = await quotationService.calculateSimple(dto)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 },
            )
        }
    }

    async createSimple(req: NextRequest) {
        try {
            const dto = parseSimpleCalculatorBody(await req.json())
            const result = await quotationService.createSimple(dto)
            return NextResponse.json(result, { status: 201 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 },
            )
        }
    }
}

export const quotationController = new QuotationController()
