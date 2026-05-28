import { NextRequest, NextResponse } from 'next/server'
import { getAuthEmployee, requireAdmin } from '@/lib/auth-guard'
import { shippingProviderService } from '../services/shipping-provider.service'

function errResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : 'Error interno'
  const status =
    msg.startsWith('Forbidden')
      ? 403
      : msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('token')
        ? 401
        : msg.includes('no encontrad') || msg.includes('not found')
          ? 404
          : 500
  return NextResponse.json({ message: msg }, { status })
}

class ShippingProviderController {
  async findAll(req: NextRequest) {
    try {
      await getAuthEmployee(req)
      const data = await shippingProviderService.findAll()
      return NextResponse.json({ data, total: data.length })
    } catch (error: unknown) {
      return errResponse(error)
    }
  }

  async getRates(req: NextRequest, providerId: number) {
    try {
      await getAuthEmployee(req)
      const data = await shippingProviderService.getRates(providerId)
      return NextResponse.json({ data, total: data.length })
    } catch (error: unknown) {
      return errResponse(error)
    }
  }

  async createRate(req: NextRequest, providerId: number) {
    try {
      await requireAdmin(req)
      const dto = await req.json()
      if (dto.destinationId === undefined || dto.basePrice === undefined) {
        return NextResponse.json(
          { message: 'destinationId y basePrice son requeridos' },
          { status: 400 },
        )
      }
      const result = await shippingProviderService.createRate(providerId, dto)
      return NextResponse.json(result, { status: 201 })
    } catch (error: unknown) {
      return errResponse(error)
    }
  }

  async updateRate(req: NextRequest, providerId: number, rateId: number) {
    try {
      await requireAdmin(req)
      const dto = await req.json()
      const result = await shippingProviderService.updateRate(providerId, rateId, dto)
      return NextResponse.json(result)
    } catch (error: unknown) {
      return errResponse(error)
    }
  }

  async deleteRate(req: NextRequest, providerId: number, rateId: number) {
    try {
      await requireAdmin(req)
      await shippingProviderService.deleteRate(providerId, rateId)
      return new NextResponse(null, { status: 204 })
    } catch (error: unknown) {
      return errResponse(error)
    }
  }
}

export const shippingProviderController = new ShippingProviderController()
