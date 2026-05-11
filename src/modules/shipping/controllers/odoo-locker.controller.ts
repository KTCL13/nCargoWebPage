import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getAuthEmployee } from '@/lib/auth-guard'
import { odooLockerService } from '../services/odoo-locker.service'

class OdooLockerController {
  async syncLockers(req: NextRequest) {
    try {
      requireAdmin(req)
      const body = await req.json().catch(() => ({}))
      const searchTerm: string = body.searchTerm?.trim() || 'Suscripción Casillero'
      const result = await odooLockerService.syncFromOdoo(searchTerm)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json({ message: (error as Error).message }, { status: 400 })
    }
  }

  async getLockers(req: NextRequest) {
    try {
      getAuthEmployee(req)
      const { searchParams } = new URL(req.url)
      const page = parseInt(searchParams.get('page') ?? '1')
      const limit = parseInt(searchParams.get('limit') ?? '10')
      const result = await odooLockerService.getAllLockers(page, limit)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json({ message: (error as Error).message }, { status: 400 })
    }
  }

  async getShipments(req: NextRequest) {
    try {
      getAuthEmployee(req)
      const { searchParams } = new URL(req.url)

      const filters = {
        search: searchParams.get('search') ?? undefined,
        statusId: searchParams.get('statusId') ? parseInt(searchParams.get('statusId')!) : undefined,
        isLocker: searchParams.has('isLocker') ? searchParams.get('isLocker') === 'true' : undefined,
        dateFrom: searchParams.get('dateFrom') ?? undefined,
        dateTo: searchParams.get('dateTo') ?? undefined,
        page: parseInt(searchParams.get('page') ?? '1'),
        pageSize: parseInt(searchParams.get('pageSize') ?? '15'),
      }

      const result = await odooLockerService.getShipments(filters)
      const totalPages = Math.ceil(result.total / filters.pageSize)
      return NextResponse.json({ ...result, page: filters.page, pageSize: filters.pageSize, totalPages })
    } catch (error) {
      return NextResponse.json({ message: (error as Error).message }, { status: 400 })
    }
  }

  async updateShipment(req: NextRequest) {
    try {
      const employee = getAuthEmployee(req)
      const body = await req.json()
      const { id, trackingNumber, odooStageName, comment } = body

      if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 })

      const result = await odooLockerService.updateShipment(
        Number(id),
        trackingNumber,
        odooStageName,
        comment,
        employee.id,
      )
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json({ message: (error as Error).message }, { status: 400 })
    }
  }

  async getLockerShipments(req: NextRequest, lockerId: number) {
    try {
      getAuthEmployee(req)
      const { searchParams } = new URL(req.url)
      const search = searchParams.get('search') ?? undefined
      const page = parseInt(searchParams.get('page') ?? '1')
      const limit = parseInt(searchParams.get('limit') ?? '10')
      const result = await odooLockerService.getShipmentsForLocker(lockerId, page, limit, search)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json({ message: (error as Error).message }, { status: 400 })
    }
  }

  async createLockerShipment(req: NextRequest, lockerId: number) {
    try {
      const employee = getAuthEmployee(req)
      const body = await req.json()
      const { name, description } = body

      if (!name) return NextResponse.json({ message: 'name is required' }, { status: 400 })

      const shipment = await odooLockerService.createShipment(lockerId, name, description, employee.id)
      return NextResponse.json(shipment, { status: 201 })
    } catch (error) {
      return NextResponse.json({ message: (error as Error).message }, { status: 400 })
    }
  }
}

export const odooLockerController = new OdooLockerController()
