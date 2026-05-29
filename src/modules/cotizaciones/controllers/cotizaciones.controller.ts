import { NextRequest, NextResponse } from 'next/server'
import { cotizacionCalculatorService } from '../services/cotizacion-calculator.service'
import { CalcularCotizacionSchema } from '../dtos/cotizacion.dto'

class CotizacionesController {
  async calcular(req: NextRequest) {
    try {
      const raw = await req.json().catch(() => null)
      if (!raw || typeof raw !== 'object') {
        return NextResponse.json({ message: 'Body inválido' }, { status: 400 })
      }

      // Normalize country to uppercase before Zod parses it
      const normalized = { ...raw, country: String((raw as Record<string, unknown>).country ?? '').toUpperCase() }

      const parsed = CalcularCotizacionSchema.safeParse(normalized)
      if (!parsed.success) {
        const first = parsed.error.issues[0]
        return NextResponse.json({ message: first?.message ?? 'Datos de entrada inválidos' }, { status: 400 })
      }

      const result = await cotizacionCalculatorService.calculate(parsed.data)
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
          { message: 'El parámetro "country" debe ser CO (Colombia) o MX (México)' },
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
