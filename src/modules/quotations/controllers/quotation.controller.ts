import { NextRequest, NextResponse } from 'next/server'
import { quotationService } from '../services/quotation.service'
import { SimpleCalculatorSchema } from '../dtos/simple-calculator.dto'

function parseSimpleCalculatorBody(body: unknown) {
    const result = SimpleCalculatorSchema.safeParse(body)
    if (!result.success) {
        const first = result.error.issues[0]
        throw new Error(first?.message ?? 'Datos de entrada inválidos')
    }
    return result.data
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
