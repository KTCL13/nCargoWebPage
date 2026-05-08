import { NextRequest, NextResponse } from 'next/server'
import { getAuthEmployee } from '@/lib/auth-guard'
import { locationService } from '../services/location.service'

function errStatus(msg: string) {
  return msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('token') ? 401 : 500
}

class LocationController {
  async findAll(req: NextRequest) {
    try {
      getAuthEmployee(req)
      const country = new URL(req.url).searchParams.get('country')
      if (country) {
        const data = await locationService.findByCountry(country)
        return NextResponse.json({ data, total: data.length })
      }
      const data = await locationService.findCountries()
      return NextResponse.json({ data, total: data.length })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error interno'
      return NextResponse.json({ message: msg }, { status: errStatus(msg) })
    }
  }

  async create(req: NextRequest) {
    try {
      getAuthEmployee(req)
      const { name, code } = await req.json()
      if (!name || !code) {
        return NextResponse.json({ message: 'name y code son requeridos' }, { status: 400 })
      }
      if (code.length > 10) {
        return NextResponse.json({ message: 'code debe tener máximo 10 caracteres' }, { status: 400 })
      }
      const data = await locationService.createCountry(name, code)
      return NextResponse.json(data, { status: 201 })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error interno'
      return NextResponse.json({ message: msg }, { status: errStatus(msg) })
    }
  }

  async update(req: NextRequest, id: number) {
    try {
      getAuthEmployee(req)
      const { name } = await req.json()
      if (!name || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ message: 'name es requerido' }, { status: 400 })
      }
      await locationService.updateLocation(id, name.trim())
      return NextResponse.json({ ok: true })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error interno'
      return NextResponse.json({ message: msg }, { status: errStatus(msg) })
    }
  }

  async findByCountry(req: NextRequest) {
    return this.findAll(req)
  }
}

export const locationController = new LocationController()
