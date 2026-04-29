import { NextRequest, NextResponse } from 'next/server'
import { cotizacionCalculatorService } from '../services/cotizacion-calculator.service'

class CotizacionesController {
  async calcular(req: NextRequest) {
    try {
      const body = await req.json()
      const { country, actualWeightLb, heightIn, lengthIn, widthIn, declaredValueUsd } = body

      if (
        !country ||
        actualWeightLb === undefined ||
        !heightIn ||
        !lengthIn ||
        !widthIn ||
        declaredValueUsd === undefined
      ) {
        return NextResponse.json(
          {
            message:
              'Campos requeridos: country, actualWeightLb, heightIn, lengthIn, widthIn, declaredValueUsd',
          },
          { status: 400 },
        )
      }

      if (!['CO', 'MX'].includes(String(country).toUpperCase())) {
        return NextResponse.json({ message: 'country debe ser CO o MX' }, { status: 400 })
      }

      const employeeId: number | undefined =
        body.employeeId != null ? Number(body.employeeId) : undefined

      const result = await cotizacionCalculatorService.calculate({
        ...body,
        country:    String(country).toUpperCase() as 'CO' | 'MX',
        employeeId,
      })
      return NextResponse.json(result)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error interno'
      return NextResponse.json({ message: msg }, { status: 400 })
    }
  }

  async ciudades(req: NextRequest) {
    try {
      const country = new URL(req.url).searchParams.get('country') ?? ''
      if (!['CO', 'MX'].includes(country.toUpperCase())) {
        return NextResponse.json(
          { message: 'Parámetro country debe ser CO o MX' },
          { status: 400 },
        )
      }
      const result = await cotizacionCalculatorService.getCiudades(country.toUpperCase())
      return NextResponse.json(result)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error interno'
      return NextResponse.json({ message: msg }, { status: 500 })
    }
  }
}

export const cotizacionesController = new CotizacionesController()
