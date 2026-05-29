import { prisma } from '@/lib/prisma'
import type { Decimal } from '@prisma/client/runtime/library'

export interface CotizacionAnalyticsParams {
  from?: string
  to?: string
  country?: string
}

function n(d: Decimal | null | undefined): number {
  return d ? Number(d) : 0
}

export async function getCotizacionAnalytics(params: CotizacionAnalyticsParams) {
  const { from, to, country } = params

  const dateFilter: { gte?: Date; lte?: Date } = {}
  if (from) dateFilter.gte = new Date(from)
  if (to) {
    const d = new Date(to)
    d.setHours(23, 59, 59, 999)
    dateFilter.lte = d
  }

  const createdAt = Object.keys(dateFilter).length ? dateFilter : undefined
  const baseWhere = {
    ...(createdAt ? { createdAt } : {}),
    ...(country ? { country } : {}),
  }

  const [agg, countByCO, countByMX, odooSent] = await Promise.all([
    prisma.cotizacionRecord.aggregate({
      where: baseWhere,
      _sum: {
        total: true,
        transport: true,
        volumetricSurcharge: true,
        insurance: true,
        customs: true,
        cityDelivery: true,
        pickup: true,
      },
      _avg: { total: true },
      _count: { id: true },
    }),
    prisma.cotizacionRecord.count({ where: { ...baseWhere, country: 'CO' } }),
    prisma.cotizacionRecord.count({ where: { ...baseWhere, country: 'MX' } }),
    prisma.quotation.count({
      where: {
        odooOrderId: { not: null },
        ...(createdAt ? { createdAt } : {}),
      },
    }),
  ])

  const totalRevenue = n(agg._sum.total)

  const pct = (v: Decimal | null | undefined) =>
    totalRevenue > 0 ? Math.round((n(v) / totalRevenue) * 1000) / 10 : 0

  const costBreakdown = {
    transport: { total: n(agg._sum.transport), pct: pct(agg._sum.transport) },
    volumetricSurcharge: { total: n(agg._sum.volumetricSurcharge), pct: pct(agg._sum.volumetricSurcharge) },
    insurance: { total: n(agg._sum.insurance), pct: pct(agg._sum.insurance) },
    customs: { total: n(agg._sum.customs), pct: pct(agg._sum.customs) },
    cityDelivery: { total: n(agg._sum.cityDelivery), pct: pct(agg._sum.cityDelivery) },
    pickup: { total: n(agg._sum.pickup), pct: pct(agg._sum.pickup) },
  }

  // Top employees by Odoo-sent quotations
  const odooWhere = {
    odooOrderId: { not: null as null },
    employeeId: { not: null as null },
    ...(createdAt ? { createdAt } : {}),
  }
  const topByOdoo = await prisma.quotation.groupBy({
    by: ['employeeId'],
    where: odooWhere,
    _count: { id: true },
    _sum: { totalPrice: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  })

  const employeeIds = topByOdoo.map(r => r.employeeId!).filter(Boolean)
  const employees = employeeIds.length
    ? await prisma.employee.findMany({
        where: { id: { in: employeeIds } },
        select: { id: true, firstName: true, lastName: true },
      })
    : []
  const empMap = new Map(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]))

  const topEmployees = topByOdoo.map(r => ({
    employeeId: r.employeeId!,
    employeeName: empMap.get(r.employeeId!) ?? `Empleado #${r.employeeId}`,
    quotationsSent: r._count.id,
    totalValue: n(r._sum.totalPrice),
  }))

  // Package patterns
  const records = await prisma.cotizacionRecord.findMany({
    where: baseWhere,
    select: { chargeableWeightLb: true, pickup: true, total: true },
  })

  const buckets = [
    { label: 'Pequeño (≤14 lb)', min: 0, max: 14 },
    { label: 'Mediano (15–70 lb)', min: 15, max: 70 },
    { label: 'Grande (>70 lb)', min: 71, max: Infinity },
  ]

  const packagePatterns = buckets.map(b => {
    const inBucket = records.filter(r => {
      const w = Number(r.chargeableWeightLb)
      return w >= b.min && w <= b.max
    })
    const withPickup = inBucket.filter(r => Number(r.pickup) > 0).length
    const totalSum = inBucket.reduce((s, r) => s + Number(r.total), 0)
    return {
      label: b.label,
      count: inBucket.length,
      withPickup,
      withoutPickup: inBucket.length - withPickup,
      avgTotal: inBucket.length > 0 ? Math.round((totalSum / inBucket.length) * 100) / 100 : 0,
      pct: records.length > 0 ? Math.round((inBucket.length / records.length) * 1000) / 10 : 0,
    }
  })

  // Top destinations
  const destGroups = await prisma.cotizacionRecord.groupBy({
    by: ['destinationLocationId'],
    where: { ...baseWhere, destinationLocationId: { not: null } },
    _count: { id: true },
    _sum: { total: true },
    _avg: { total: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 10,
  })

  const locationIds = destGroups.map(d => d.destinationLocationId!).filter(Boolean)
  const locations = locationIds.length
    ? await prisma.location.findMany({
        where: { id: { in: locationIds } },
        select: { id: true, name: true, parent: { select: { name: true } } },
      })
    : []
  const locMap = new Map(locations.map(l => [l.id, l]))

  const topDestinations = destGroups.map(d => {
    const loc = locMap.get(d.destinationLocationId!)
    return {
      city: loc?.name ?? 'Desconocido',
      department: loc?.parent?.name ?? '',
      count: d._count.id,
      totalRevenue: n(d._sum.total),
      avgTotal: Math.round(n(d._avg.total) * 100) / 100,
    }
  })

  return {
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalQuotations: agg._count.id,
      avgTicket: Math.round(n(agg._avg.total) * 100) / 100,
      sentToOdoo: odooSent,
      byCO: countByCO,
      byMX: countByMX,
    },
    costBreakdown,
    topEmployees,
    packagePatterns,
    topDestinations,
  }
}
