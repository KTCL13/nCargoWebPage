import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Country, CityItem, Breakdown, Office, Dimensions } from './types'

export function useCotizaciones() {
  const { user } = useAuth()

  // State
  const [country, setCountry] = useState<Country>('CO')
  const [allCities, setAllCities] = useState<CityItem[]>([])
  const [flatRate, setFlatRate] = useState<{ enabled: boolean; price: number }>({ enabled: false, price: 0 })
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [dept, setDept] = useState('')
  const [cityId, setCityId] = useState('')
  const [weight, setWeight] = useState('')
  const [dims, setDims] = useState<Dimensions>({ h: '', w: '', l: '' })
  const [valor, setValor] = useState('')
  const [millas, setMillas] = useState('0')
  const [result, setResult] = useState<Breakdown | null>(null)
  const [quotationId, setQuotationId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [offices, setOffices] = useState<Office[]>([])
  const [origin, setOrigin] = useState<Office | null>(null)

  // Odoo Modal State
  const [isOdooModalOpen, setIsOdooModalOpen] = useState(false)
  const [odooSearchQuery, setOdooSearchQuery] = useState('')
  const [isSearchingOdoo, setIsSearchingOdoo] = useState(false)
  const [odooCustomers, setOdooCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [isSendingToOdoo, setIsSendingToOdoo] = useState(false)
  const [odooError, setOdooError] = useState('')
  const [odooSuccess, setOdooSuccess] = useState('')

  // Helpers
  const parse = (v: string) => parseFloat(v.replace(',', '.')) || 0
  const volWeight = Math.ceil((parse(dims.h) * parse(dims.w) * parse(dims.l)) / 153)

  const departments = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    for (const c of allCities) {
      const d = c.department ?? ''
      if (d && !seen.has(d)) { seen.add(d); list.push(d) }
    }
    return list.sort()
  }, [allCities])

  const filteredCities = useMemo(
    () => (dept ? allCities.filter(c => c.department === dept) : []),
    [allCities, dept],
  )

  const isValid =
    !!weight && !!dims.h && !!dims.w && !!dims.l && valor !== '' &&
    (flatRate.enabled || !!cityId)

  // Side Effects
  useEffect(() => {
    fetch('/api/pickup-points?active=true')
      .then(r => r.json())
      .then(data => {
        const list: Office[] = data.data ?? []
        setOffices(list)
        if (list.length > 0) setOrigin(list[0])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setCitiesLoading(true)
    setResult(null)
    setQuotationId(null)
    setError('')
    setDept('')
    setCityId('')
    fetch(`/api/cotizaciones/ciudades?country=${country}`)
      .then(r => r.json())
      .then(data => {
        setAllCities(data.data ?? [])
        setFlatRate({ enabled: Boolean(data.flatRateEnabled), price: Number(data.flatRatePrice) })
      })
      .catch(() => setError('Error cargando ciudades'))
      .finally(() => setCitiesLoading(false))
  }, [country])

  // Odoo Search Effect
  useEffect(() => {
    if (odooSearchQuery.length < 3) {
      setOdooCustomers([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingOdoo(true)
      setOdooError('')
      try {
        const res = await fetch(`/api/odoo/customers?q=${encodeURIComponent(odooSearchQuery)}`)
        const data = await res.json()
        if (!res.ok) {
          setOdooError(data?.message || 'Error al buscar clientes')
          setOdooCustomers([])
        } else {
          setOdooCustomers(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error('Error searching Odoo customers:', err)
        setOdooError('Error al buscar clientes')
      } finally {
        setIsSearchingOdoo(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [odooSearchQuery])

  // Actions
  const handleCalc = useCallback(async () => {
    if (!isValid) {
      setError('Completa peso, dimensiones, valor declarado' + (!flatRate.enabled ? ' y ciudad' : ''))
      return
    }
    setError('')
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        country,
        actualWeightLb: parse(weight),
        heightIn: parse(dims.h),
        lengthIn: parse(dims.l),
        widthIn: parse(dims.w),
        declaredValueUsd: parse(valor),
        pickupMiles: parse(millas),
      }
      if (!flatRate.enabled && cityId) body.destinationCityId = Number(cityId)
      if (user?.id) body.employeeId = user.id

      const res = await fetch('/api/cotizaciones/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult(null)
        setQuotationId(null)
        setError(data.message ?? 'Error al calcular')
        return
      }
      setQuotationId(data.quotationId ?? null)
      setResult(data as Breakdown)
    } catch {
      setResult(null)
      setQuotationId(null)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [isValid, country, weight, dims, valor, millas, flatRate, cityId, user])

  const handleSendToOdoo = useCallback(async () => {
    if (!selectedCustomer || !result) return
    setIsSendingToOdoo(true)
    setOdooError('')
    setOdooSuccess('')

    try {
      const res = await fetch('/api/odoo/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          quotationData: result,
          country,
          quotationId,
        })
      })
      const data = await res.json()
      if (res.ok) {
        setOdooSuccess(data.message || '¡Cotización enviada con éxito!')
        setTimeout(() => {
          setIsOdooModalOpen(false)
          setOdooSuccess('')
          setSelectedCustomer(null)
          setOdooSearchQuery('')
        }, 2500)
      } else {
        setOdooError(data.message || 'Error al enviar a Odoo')
      }
    } catch (err) {
      setOdooError('Error de conexión con el servidor')
    } finally {
      setIsSendingToOdoo(false)
    }
  }, [selectedCustomer, result, country, quotationId])

  return {
    country, setCountry,
    departments, dept, setDept,
    filteredCities, cityId, setCityId,
    weight, setWeight,
    dims, setDims,
    valor, setValor,
    millas, setMillas,
    result, setResult,
    loading, error, setError,
    offices, origin, setOrigin,
    volWeight, isValid, handleCalc,
    citiesLoading, flatRate,
    
    // Odoo
    isOdooModalOpen, setIsOdooModalOpen,
    odooSearchQuery, setOdooSearchQuery,
    isSearchingOdoo, odooCustomers,
    selectedCustomer, setSelectedCustomer,
    isSendingToOdoo, odooError, odooSuccess,
    handleSendToOdoo
  }
}
