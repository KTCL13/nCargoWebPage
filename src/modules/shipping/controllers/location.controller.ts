import { NextRequest, NextResponse } from 'next/server'
import { getAuthEmployee } from '@/lib/auth-guard'
import { locationService } from '../services/location.service'

class LocationController {
  async findByCountry(req: NextRequest) {
    try {
      getAuthEmployee(req)
      const country = new URL(req.url).searchParams.get('country') ?? ''
      if (!country) {
        return NextResponse.json(
          { message: 'Parámetro country requerido (ej. ?country=CO)' },
          { status: 400 },
        )
      }
      const data = await locationService.findByCountry(country)
      return NextResponse.json({ data, total: data.length })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error interno'
      const status =
        msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('token')
          ? 401
          : 500
      return NextResponse.json({ message: msg }, { status })
    }
  }
}

export const locationController = new LocationController()
