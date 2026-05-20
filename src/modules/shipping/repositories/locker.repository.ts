import { prisma } from '@/lib/prisma'

export interface LockerUpsertData {
  odooProjectId: number
  odooProjectName: string
  customerName?: string | null
  customerEmail?: string | null
}

export interface ShipmentUpsertData {
  odooTaskId: number
  odooTaskName?: string
  odooProjectId: number
  odooProjectName: string
  odooCustomerName: string | null
  odooStageName: string | null
  providerId: number
  statusId: number
  lockerId: number
}

export interface ShipmentFilters {
  search?: string
  statusId?: number
  isLocker?: boolean
  dateFrom?: string
  dateTo?: string
  page: number
  pageSize: number
}

class LockerRepository {
  async upsertLocker(data: LockerUpsertData) {
    return prisma.locker.upsert({
      where: { odooProjectId: data.odooProjectId },
      update: {
        odooProjectName: data.odooProjectName,
        customerName: data.customerName ?? null,
        customerEmail: data.customerEmail ?? null,
        lastSyncedAt: new Date(),
      },
      create: {
        odooProjectId: data.odooProjectId,
        odooProjectName: data.odooProjectName,
        customerName: data.customerName ?? null,
        customerEmail: data.customerEmail ?? null,
        lastSyncedAt: new Date(),
      },
    })
  }

  async upsertShipmentFromTask(data: ShipmentUpsertData) {
    const existing = await prisma.shipment.findFirst({
      where: { odooTaskId: data.odooTaskId },
    })

    if (existing) {
      return prisma.shipment.update({
        where: { id: existing.id },
        data: {
          odooTaskName: data.odooTaskName ?? existing.odooTaskName,
          odooProjectId: data.odooProjectId,
          odooProjectName: data.odooProjectName,
          odooCustomerName: data.odooCustomerName,
          odooStageName: data.odooStageName,
          lockerId: data.lockerId,
        },
      })
    }

    return prisma.shipment.create({
      data: {
        odooTaskId: data.odooTaskId,
        odooTaskName: data.odooTaskName,
        odooProjectId: data.odooProjectId,
        odooProjectName: data.odooProjectName,
        odooCustomerName: data.odooCustomerName,
        odooStageName: data.odooStageName,
        isLocker: true,
        lockerId: data.lockerId,
        providerId: data.providerId,
        statusId: data.statusId,
        weightLbs: 0,
      },
    })
  }

  async findAllLockers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      prisma.locker.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { shipments: true } } },
        skip,
        take: limit,
      }),
      prisma.locker.count(),
    ])
    return { data, total }
  }

  async findShipmentsByLocker(lockerId: number, page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit
    const where = {
      lockerId,
      ...(search ? {
        OR: [
          { odooTaskName: { contains: search, mode: 'insensitive' as const } },
          { odooCustomerName: { contains: search, mode: 'insensitive' as const } },
          { trackingNumber: { contains: search, mode: 'insensitive' as const } },
          { odooStageName: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    }

    const [data, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: { status: true, provider: true, locker: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.shipment.count({ where }),
    ])
    return { data, total }
  }

  async ensureLockerDefaults() {
    const provider = await prisma.shippingProvider.upsert({
      where: { name: 'Locker' },
      update: {},
      create: { name: 'Locker' },
    })

    const status = await prisma.shipmentStatus.upsert({
      where: { name: 'Pendiente' },
      update: {},
      create: { name: 'Pendiente' },
    })

    return { providerId: provider.id, statusId: status.id }
  }

  async updateShipmentTracking(
    id: number,
    trackingNumber: string | undefined,
    odooStageName: string | undefined,
    performedBy: number,
  ) {
    const updated = await prisma.shipment.update({
      where: { id },
      data: {
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(odooStageName !== undefined && { odooStageName }),
        updatedBy: performedBy,
      },
      include: { status: true, provider: true, locker: true },
    })

    const eventNote = [
      trackingNumber !== undefined && `Tracking: ${trackingNumber}`,
      odooStageName !== undefined && `Etapa: ${odooStageName}`,
    ]
      .filter(Boolean)
      .join('; ')

    await prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        status: updated.status.name,
        notes: eventNote || 'Updated',
        performedBy,
      },
    })

    return updated
  }

  async findShipmentById(id: number) {
    return prisma.shipment.findUnique({
      where: { id },
      include: { status: true, provider: true, locker: true },
    })
  }

  // Legacy: used by employee page flat list
  async findFiltered(filters: ShipmentFilters) {
    const searchOr = filters.search ? [
      { trackingNumber: { contains: filters.search, mode: 'insensitive' as const } },
      { odooTaskName: { contains: filters.search, mode: 'insensitive' as const } },
      { odooCustomerName: { contains: filters.search, mode: 'insensitive' as const } },
      { odooProjectName: { contains: filters.search, mode: 'insensitive' as const } },
      ...(!isNaN(Number(filters.search)) ? [{ odooTaskId: Number(filters.search) }] : []),
    ] : undefined

    const dateFilter = (filters.dateFrom || filters.dateTo) ? {
      gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      lte: filters.dateTo ? (() => { const d = new Date(filters.dateTo!); d.setHours(23,59,59,999); return d })() : undefined,
    } : undefined

    const where = {
      ...(filters.isLocker !== undefined && { isLocker: filters.isLocker }),
      ...(filters.statusId && { statusId: filters.statusId }),
      ...(dateFilter && { createdAt: dateFilter }),
      ...(searchOr && { OR: searchOr }),
    }

    const skip = (filters.page - 1) * filters.pageSize
    const [data, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: { status: true, provider: true, locker: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.pageSize,
      }),
      prisma.shipment.count({ where }),
    ])

    return { data, total }
  }
}

export const lockerRepository = new LockerRepository()
