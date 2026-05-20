'use client'
import { useState, useEffect, useMemo } from 'react'
import { Country, CityItem, Office } from '@/types/cotizaciones'
import { authFetch } from '@/lib/api-client/auth-fetch'

export function useCitiesAndOffices(country: Country, dept: string) {
  const [allCities, setAllCities] = useState<CityItem[]>([])
  const [flatRate, setFlatRate] = useState({ enabled: false, price: 0 })
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [error, setError] = useState('')
  const [offices, setOffices] = useState<Office[]>([])
  const [origin, setOrigin] = useState<Office | null>(null)

  useEffect(() => {
    authFetch('/api/pickup-points?active=true')
      .then(r => r.json())
      .then(data => {
        const list: Office[] = data.data ?? []
        setOffices(list)
        if (list.length > 0) setOrigin(list[0])
      }).catch(() => {})
  }, [])

  useEffect(() => {
    setCitiesLoading(true)
    setError('')
    fetch(`/api/cotizaciones/ciudades?country=${country}`)
      .then(r => r.json())
      .then(data => {
        setAllCities(data.data ?? [])
        setFlatRate({ enabled: Boolean(data.flatRateEnabled), price: Number(data.flatRatePrice) })
      })
      .catch(() => setError('Error cargando ciudades'))
      .finally(() => setCitiesLoading(false))
  }, [country])

  const departments = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    for (const c of allCities) {
      if (c.department && !seen.has(c.department)) { seen.add(c.department); list.push(c.department) }
    }
    return list.sort()
  }, [allCities])

  const filteredCities = useMemo(() => (dept ? allCities.filter(c => c.department === dept) : []), [allCities, dept])

  return { allCities, filteredCities, departments, flatRate, citiesLoading, error, offices, origin, setOrigin }
}
