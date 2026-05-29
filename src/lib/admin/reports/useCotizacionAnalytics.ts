import { useState, useEffect, useCallback } from 'react'

export interface CostComponent {
  total: number
  pct: number
}

export interface CotizacionAnalyticsData {
  summary: {
    totalRevenue: number
    totalQuotations: number
    avgTicket: number
    sentToOdoo: number
    byCO: number
    byMX: number
  }
  costBreakdown: {
    transport: CostComponent
    volumetricSurcharge: CostComponent
    insurance: CostComponent
    customs: CostComponent
    cityDelivery: CostComponent
    pickup: CostComponent
  }
  topEmployees: {
    employeeId: number
    employeeName: string
    quotationsSent: number
    totalValue: number
  }[]
  packagePatterns: {
    label: string
    count: number
    withPickup: number
    withoutPickup: number
    avgTotal: number
    pct: number
  }[]
  topDestinations: {
    city: string
    department: string
    count: number
    totalRevenue: number
    avgTotal: number
  }[]
}

export function useCotizacionAnalytics(
  token: string | null,
  from: string,
  to: string,
  country: string,
) {
  const [data, setData] = useState<CotizacionAnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (country) params.set('country', country)
      const res = await fetch(`/api/analytics/cotizaciones?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(body.message ?? res.statusText)
      }
      setData(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [token, from, to, country])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
