import { useState, useCallback, useEffect } from 'react'
import { Country, Rate, Location, ConfigEntry, CONFIG_LABELS, FLAT_RATE_KEYS, CONTRACT_CONFIG_KEYS } from '@/types/admin/config'
import { authFetch } from '@/lib/api-client/auth-fetch'

export function useConfig(token: string | null) {
  const authHeader = {
    Authorization: `Bearer ${token ?? ''}`,
    'Content-Type': 'application/json',
  }

  const [providers,        setProviders]        = useState<{ id: number; name: string }[]>([])
  const [countries,        setCountries]        = useState<Country[]>([])
  const [ratesByCountry,   setRatesByCountry]   = useState<Record<string, Rate[]>>({})
  const [locsByCountry,    setLocsByCountry]    = useState<Record<string, Location[]>>({})
  const [flatByCountry,    setFlatByCountry]    = useState<Record<string, { enabled: boolean; price: string }>>({})
  const [newRateByCountry, setNewRateByCountry] = useState<Record<string, { destId: string; price: string }>>({})
  const [configs,          setConfigs]          = useState<ConfigEntry[]>([])
  const [loading,          setLoading]          = useState(true)
  const [ratesLoading,     setRatesLoading]     = useState(false)
  const [saving,           setSaving]           = useState<string | null>(null)
  const [providerId,       setProviderId]       = useState<number | null>(null)
  const [contractCfg,      setContractCfg]      = useState<Record<string, string>>({})
  const [savingCfgKey,     setSavingCfgKey]     = useState<string | null>(null)

  const loadRates = useCallback(async (pid: number, countryList: Country[]) => {
    setRatesLoading(true)
    try {
      const [rateRes, ...locResponses] = await Promise.all([
        authFetch(`/api/shipping-providers/${pid}/rates`, { headers: authHeader }).then(r => r.json()),
        ...countryList.map(c => authFetch(`/api/locations?country=${c.code}`, { headers: authHeader }).then(r => r.json())),
      ])

      const all: Rate[] = rateRes.data ?? []
      const byCountry: Record<string, Rate[]> = {}
      for (const c of countryList) byCountry[c.code] = all.filter(r => r.destination.country === c.code)
      setRatesByCountry(byCountry)

      const byLoc: Record<string, Location[]> = {}
      countryList.forEach((c, i) => {
        const rateDestIds = new Set(byCountry[c.code].map(r => r.destination.id))
        byLoc[c.code] = (locResponses[i].data ?? []).filter((l: Location) => !rateDestIds.has(l.id))
      })
      setLocsByCountry(byLoc)

      const newRateInit: Record<string, { destId: string; price: string }> = {}
      for (const c of countryList) newRateInit[c.code] = { destId: '', price: '' }
      setNewRateByCountry(newRateInit)
    } finally {
      setRatesLoading(false)
    }
  }, [token])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [provRes, cfgRes, countryRes] = await Promise.all([
        authFetch('/api/shipping-providers', { headers: authHeader }).then(r => r.json()),
        authFetch('/api/system-config').then(r => r.json()),
        authFetch('/api/locations', { headers: authHeader }).then(r => r.json()),
      ])

      const provList: { id: number; name: string }[] = provRes.data ?? []
      setProviders(provList)
      const pid: number | null = provList[0]?.id ?? null
      setProviderId(pid)

      const allCountries: Country[] = (countryRes.data ?? []).filter((c: Country & { code: string | null }) => c.code)
      setCountries(allCountries)

      const cfgMap: Record<string, unknown> = {}
      for (const { key, value } of cfgRes.data ?? []) cfgMap[key] = value

      const flatInit: Record<string, { enabled: boolean; price: string }> = {}
      for (const c of allCountries) {
        const k = c.code.toLowerCase()
        flatInit[c.code] = {
          enabled: Boolean(cfgMap[`${k}_flat_rate_enabled`]),
          price: String(cfgMap[`${k}_flat_rate_price`] ?? '0'),
        }
      }
      setFlatByCountry(flatInit)

      const globals = (cfgRes.data ?? []).filter(
        (e: ConfigEntry) => CONFIG_LABELS[e.key as string] && !FLAT_RATE_KEYS.has(e.key as string),
      )
      setConfigs(globals)

      const contractKeys = new Set(CONTRACT_CONFIG_KEYS.map(c => c.key))
      const contractMap: Record<string, string> = {}
      for (const { key, value } of cfgRes.data ?? []) {
        if (contractKeys.has(key as string)) contractMap[key as string] = String(value)
      }
      setContractCfg(contractMap)

      if (pid) await loadRates(pid, allCountries)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const patchConfig = async (key: string, value: unknown) => {
    await authFetch(`/api/system-config/${key}`, {
      method: 'PATCH',
      headers: authHeader,
      body: JSON.stringify({ value }),
    })
  }

  const saveFlatRate = async (countryCode: string) => {
    const flat = flatByCountry[countryCode]
    if (!flat) return
    const k = countryCode.toLowerCase()
    setSaving(`flat-${countryCode}`)
    try {
      await patchConfig(`${k}_flat_rate_enabled`, flat.enabled)
      await patchConfig(`${k}_flat_rate_price`, Number(flat.price))
      alert(`Tarifa plana ${countryCode} guardada`)
    } catch { alert('Error al guardar') }
    finally { setSaving(null) }
  }

  const saveRate = async (rateId: number, price: number) => {
    if (!providerId) return
    await authFetch(`/api/shipping-providers/${providerId}/rates/${rateId}`, {
      method: 'PATCH',
      headers: authHeader,
      body: JSON.stringify({ basePrice: price }),
    })
  }

  const saveLocation = async (locationId: number, name: string) => {
    await authFetch(`/api/locations/${locationId}`, {
      method: 'PATCH',
      headers: authHeader,
      body: JSON.stringify({ name }),
    })
    if (providerId) await loadRates(providerId, countries)
  }

  const deleteRate = async (rateId: number) => {
    if (!providerId || !confirm('¿Eliminar esta tarifa?')) return
    await authFetch(`/api/shipping-providers/${providerId}/rates/${rateId}`, {
      method: 'DELETE',
      headers: authHeader,
    })
    loadRates(providerId, countries)
  }

  const addRate = async (countryCode: string) => {
    if (!providerId) return
    const nr = newRateByCountry[countryCode]
    if (!nr?.destId || !nr?.price) return
    setSaving(`add-${countryCode}`)
    try {
      await authFetch(`/api/shipping-providers/${providerId}/rates`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ destinationId: Number(nr.destId), basePrice: Number(nr.price), countryCode }),
      })
      loadRates(providerId, countries)
    } finally { setSaving(null) }
  }

  const saveConfig = async (key: string, value: unknown) => {
    setSaving(`cfg-${key}`)
    try {
      await patchConfig(key, Number(value))
      alert(`${CONFIG_LABELS[key] ?? key} guardado`)
    } catch { alert('Error al guardar') }
    finally { setSaving(null) }
  }

  const saveContractCfg = async (key: string) => {
    const val = contractCfg[key]
    if (val === undefined || val === '') return
    setSavingCfgKey(key)
    try {
      await patchConfig(key, Number(val))
      alert('Guardado correctamente')
    } catch { alert('Error al guardar') }
    finally { setSavingCfgKey(null) }
  }

  return {
    providers, countries, ratesByCountry, locsByCountry, flatByCountry, setFlatByCountry,
    newRateByCountry, setNewRateByCountry, configs, loading, ratesLoading, saving,
    providerId, setProviderId, contractCfg, setContractCfg, savingCfgKey,
    load, loadRates, saveFlatRate, saveRate, saveLocation, deleteRate, addRate, saveConfig, saveContractCfg
  }
}
