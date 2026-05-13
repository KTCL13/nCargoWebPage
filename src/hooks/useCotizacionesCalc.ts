'use client'
import { useState, useCallback } from 'react'
import { Breakdown, Country } from '@/types/cotizaciones'

type CalcParams = {
  country: Country; weight: string; dims: { h: string; w: string; l: string };
  valor: string; millas: string; cityId: string;
  flatRateEnabled: boolean; employeeId?: number;
}

export function useCotizacionesCalc(parseFn: (v: string) => number) {
  const [result, setResult] = useState<Breakdown | null>(null)
  const [quotationId, setQuotationId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const calculate = useCallback(async (params: CalcParams) => {
    setError(''); setLoading(true)
    try {
      const body: Record<string, unknown> = {
        country: params.country,
        actualWeightLb: parseFn(params.weight),
        heightIn: parseFn(params.dims.h),
        lengthIn: parseFn(params.dims.l),
        widthIn: parseFn(params.dims.w),
        declaredValueUsd: parseFn(params.valor),
        pickupMiles: parseFn(params.millas),
      }
      if (!params.flatRateEnabled && params.cityId) body.destinationCityId = Number(params.cityId)
      if (params.employeeId) body.employeeId = params.employeeId

      const res = await fetch('/api/cotizaciones/calcular', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) { setResult(null); setQuotationId(null); setError(data.message ?? 'Error al calcular'); return }
      setQuotationId(data.quotationId ?? null); setResult(data as Breakdown)
    } catch {
      setResult(null); setQuotationId(null); setError('Error de conexión')
    } finally { setLoading(false) }
  }, [parseFn])

  return { calculate, result, setResult, quotationId, setQuotationId, loading, error, setError }
}
