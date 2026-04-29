'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useAuth } from '@/context/AuthContext'

// ── Types ─────────────────────────────────────────────────────────────────────

type Country = 'CO' | 'MX'
type CityItem = { id: number; city: string; department: string | null }

type Breakdown = {
  total: number
  transport: number
  volumetricSurcharge: number
  insurance: number
  customs: number
  cityDelivery: number
  pickup: number
  detail: {
    actualWeightLb: number
    volumetricWeightLb: number
    chargeableWeightLb: number
    flatRateApplied: boolean
    cityName: string | null
  }
}

// ── Map panel origins ─────────────────────────────────────────────────────────

const ORIGINS = [
  { value: 'miami', label: '📦 Miami, FL — Almacén Principal', addr: '7950 NW 53rd St, Miami, FL 33166' },
  { value: 'houston', label: '🏭 Houston, TX — Centro de Distribución', addr: '1234 Westheimer Rd, Houston, TX 77006' },
  { value: 'laredo', label: '🌉 Laredo, TX — Frontera México', addr: '2200 Corpus Christi St, Laredo, TX 78043' },
  { value: 'losangeles', label: '🌴 Los Ángeles, CA — Puerto Oeste', addr: '5000 S Alameda St, Los Angeles, CA 90058' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function CotizacionesPage() {
  const { user } = useAuth()

  const [country, setCountry] = useState<Country>('CO')
  const [allCities, setAllCities] = useState<CityItem[]>([])
  const [flatRate, setFlatRate] = useState<{ enabled: boolean; price: number }>({ enabled: false, price: 0 })
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [dept, setDept] = useState('')
  const [cityId, setCityId] = useState('')
  const [weight, setWeight] = useState('')
  const [dims, setDims] = useState({ h: '', w: '', l: '' })
  const [valor, setValor] = useState('')
  const [millas, setMillas] = useState('0')
  const [result, setResult] = useState<Breakdown | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [origin, setOrigin] = useState(ORIGINS[0])

  // ── Odoo Modal State ──
  const [isOdooModalOpen, setIsOdooModalOpen] = useState(false)
  const [odooSearchQuery, setOdooSearchQuery] = useState('')
  const [isSearchingOdoo, setIsSearchingOdoo] = useState(false)
  const [odooCustomers, setOdooCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [isSendingToOdoo, setIsSendingToOdoo] = useState(false)
  const [odooError, setOdooError] = useState('')
  const [odooSuccess, setOdooSuccess] = useState('')

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

  useEffect(() => {
    setCitiesLoading(true)
    setResult(null)
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

  const handleCalc = async () => {
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
      if (!res.ok) { setError(data.message ?? 'Error al calcular'); return }
      setResult(data as Breakdown)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // ── Odoo Search Effect ──
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
        setOdooCustomers(data)
      } catch (err) {
        console.error('Error searching Odoo customers:', err)
        setOdooError('Error al buscar clientes')
      } finally {
        setIsSearchingOdoo(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [odooSearchQuery])

  const handleSendToOdoo = async () => {
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
          quotationData: result
        })
      })
      const data = await res.json()
      if (res.ok) {
        setOdooSuccess('¡Cotización enviada con éxito!')
        setTimeout(() => {
          setIsOdooModalOpen(false)
          setOdooSuccess('')
          setSelectedCustomer(null)
          setOdooSearchQuery('')
        }, 2000)
      } else {
        setOdooError(data.message || 'Error al enviar a Odoo')
      }
    } catch (err) {
      setOdooError('Error de conexión con el servidor')
    } finally {
      setIsSendingToOdoo(false)
    }
  }

  const inp = 'border border-black/15 rounded-lg px-3 py-2 text-sm font-body outline-none focus:border-[var(--color-nc-blue)] transition-colors bg-white w-full'

  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(origin.addr)}&z=14&output=embed`

  return (
    <DashboardLayout
      pageTitle="Cotizaciones"
      navItems={NAV_ITEMS}
      onReload={() => window.location.reload()}
    >
      <h2 className="font-titles text-2xl font-extrabold text-[var(--color-nc-dark)]">Cotizaciones</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Calculator panel ── */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 flex flex-col gap-5">

          <div>
            <p className="font-titles text-base font-bold text-[var(--color-nc-dark)]">Calculadora de Envío</p>
            <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50 mt-0.5">Selecciona el país destino</p>
          </div>

          {/* Country toggle */}
          <div className="grid grid-cols-2 gap-2 bg-[#F0F1F5] p-1 rounded-xl">
            {(['CO', 'MX'] as Country[]).map(c => (
              <button
                key={c}
                onClick={() => { setCountry(c); setResult(null); setError('') }}
                className={`py-2 px-3 rounded-lg text-xs font-subtitles font-semibold transition-all text-center ${country === c
                    ? 'bg-[var(--color-nc-dark)] text-white shadow-md'
                    : 'text-[var(--color-nc-dark)]/60 hover:bg-white/60'
                  }`}
              >
                {c === 'CO' ? '🇨🇴 USA → Colombia' : '🇲🇽 USA → México'}
              </button>
            ))}
          </div>

          {/* Department → City cascade */}
          {citiesLoading ? (
            <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/40 animate-pulse">Cargando ciudades...</p>
          ) : flatRate.enabled ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="font-subtitles text-sm text-amber-800">
                Tarifa única para {country === 'CO' ? 'Colombia' : 'México'}: <strong>USD {flatRate.price.toFixed(2)}</strong>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/60">🗺️ Departamento</label>
                <select
                  value={dept}
                  onChange={e => { setDept(e.target.value); setCityId(''); setError('') }}
                  className={inp}
                >
                  <option value="">Selecciona</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/60">🌎 Ciudad</label>
                <select
                  value={cityId}
                  onChange={e => { setCityId(e.target.value); setError('') }}
                  className={inp}
                  disabled={!dept}
                >
                  <option value="">{dept ? 'Selecciona' : '— elige depto —'}</option>
                  {filteredCities.map(c => <option key={c.id} value={c.id}>{c.city}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Dimensions + weight */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/60">⚖️ Peso real (lb)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="ej. 5.0" min="0.1" step="0.1" className={inp} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/60">📐 Peso volumétrico (lb)</label>
              <input type="number" value={volWeight || ''} readOnly placeholder="auto"
                className="border border-black/15 rounded-lg px-3 py-2 text-sm font-body bg-[#ECEEF2] cursor-not-allowed w-full" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/60">↕ Alto (in)</label>
              <input type="number" value={dims.h} onChange={e => setDims(p => ({ ...p, h: e.target.value }))} placeholder="0" min="0" className={inp} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/60">↔ Ancho (in)</label>
              <input type="number" value={dims.w} onChange={e => setDims(p => ({ ...p, w: e.target.value }))} placeholder="0" min="0" className={inp} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/60">↕ Largo (in)</label>
              <input type="number" value={dims.l} onChange={e => setDims(p => ({ ...p, l: e.target.value }))} placeholder="0" min="0" className={inp} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/60">💵 Valor declarado (USD)</label>
              <input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="ej. 100" min="0" className={inp} />
            </div>
          </div>

          {/* Pickup miles */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="font-subtitles text-sm font-semibold text-amber-800">🛣️ Millas de recogida:</span>
            <input
              type="number" value={millas} onChange={e => setMillas(e.target.value)}
              placeholder="0" min="0" step="0.1"
              className="w-20 border-b border-amber-400 bg-transparent px-1 py-0.5 text-sm font-body text-amber-900 outline-none text-center"
            />
            <span className="font-subtitles text-sm text-amber-700">mi</span>
          </div>

          {/* Validation error */}
          {error && (
            <p className="font-subtitles text-xs font-semibold text-red-500">{error}</p>
          )}

          {/* Result card */}
          {result !== null && (
            <div className="bg-[var(--color-nc-dark)] rounded-2xl px-6 py-5">
              <p className="font-subtitles text-xs text-white/50 uppercase tracking-wide mb-1 text-center">Total de la cotización</p>
              <p className="font-titles text-4xl font-extrabold text-white text-center">
                <small className="text-base font-normal text-white/60">USD </small>{result.total.toFixed(2)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-subtitles text-white/60">
                <span>Transporte</span>          <span className="text-right text-white/80">USD {result.transport.toFixed(2)}</span>
                <span>Recargo volumétrico</span>  <span className="text-right text-white/80">USD {result.volumetricSurcharge.toFixed(2)}</span>
                <span>Seguro</span>               <span className="text-right text-white/80">USD {result.insurance.toFixed(2)}</span>
                <span>Aduana</span>               <span className="text-right text-white/80">USD {result.customs.toFixed(2)}</span>
                <span>Entrega ciudad</span>       <span className="text-right text-white/80">USD {result.cityDelivery.toFixed(2)}</span>
                <span>Recogida</span>             <span className="text-right text-white/80">USD {result.pickup.toFixed(2)}</span>
              </div>
              {result.detail.cityName && (
                <p className="font-subtitles text-[10px] text-white/40 mt-3 text-center">
                  Ciudad: {result.detail.cityName}{result.detail.flatRateApplied ? ' (tarifa plana)' : ''}
                </p>
              )}
              <p className="font-subtitles text-[10px] text-white/30 mt-1 text-center">
                *Estimado. Aduana puede aplicar cargos adicionales.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCalc}
              disabled={!isValid || loading}
              className={`flex-1 btn-primary py-3 rounded-xl text-sm font-bold font-subtitles transition-opacity ${(!isValid || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Calculando...' : '📦 Calcular Envío'}
            </button>
            <button
              onClick={() => {
                if (!result) { 
                  setError('Primero realiza un cálculo antes de enviar a Odoo.')
                  return 
                }
                setIsOdooModalOpen(true)
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold font-subtitles text-white transition-all hover:brightness-110 ${!result ? 'opacity-40 cursor-not-allowed' : 'active:scale-95 shadow-md shadow-[#714B67]/20'}`}
              style={{ background: '#714B67' }}
            >
              Enviar a Odoo
            </button>
          </div>
        </div>

        {/* ── Map panel ── */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-black/5">
            <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)] flex items-center gap-2">
              📍 Seleccionar Punto de Recogida
            </p>
            <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50 mt-0.5 mb-3">
              Elige el almacén más cercano
            </p>
            <select
              value={origin.value}
              onChange={e => setOrigin(ORIGINS.find(o => o.value === e.target.value) ?? ORIGINS[0])}
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm font-body bg-[#F7F8FA] outline-none focus:border-[var(--color-nc-blue)] transition-colors"
            >
              {ORIGINS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <iframe
            key={origin.value}
            src={mapSrc}
            className="flex-1 min-h-[300px] w-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          <div className="px-5 py-3 border-t border-black/5 flex items-center justify-between gap-3 bg-[#F7F8FA]">
            <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/60 flex items-center gap-1.5">
              📍 <span>{origin.addr}</span>
            </p>
            <a
              href={`https://maps.google.com/maps?q=${encodeURIComponent(origin.addr)}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-subtitles font-semibold text-white bg-[var(--color-nc-dark)] px-3 py-1.5 rounded-lg hover:bg-[var(--color-nc-blue)] transition-colors whitespace-nowrap"
            >
              🧭 Cómo llegar
            </a>
          </div>
        </div>

      </div>

      {/* Odoo Search Modal */}
      {isOdooModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#714B67]/5">
              <div>
                <h3 className="font-titles text-xl font-bold text-[#714B67]">Vincular Cliente Odoo</h3>
                <p className="font-subtitles text-xs text-gray-500 mt-1">Busca y selecciona el cliente para la cotización</p>
              </div>
              <button
                onClick={() => setIsOdooModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-5">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o CC..."
                  value={odooSearchQuery}
                  onChange={(e) => setOdooSearchQuery(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 pl-12 text-sm font-subtitles outline-none focus:border-[#714B67] transition-all"
                  autoFocus
                />
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                {isSearchingOdoo && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-[#714B67] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Results List */}
              <div className="max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-2">
                {odooCustomers.length > 0 ? (
                  odooCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className={`flex flex-col gap-1 p-4 rounded-2xl border-2 text-left transition-all ${selectedCustomer?.id === customer.id
                          ? 'border-[#714B67] bg-[#714B67]/5'
                          : 'border-gray-50 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-titles font-bold text-gray-900">{customer.name}</span>
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">ID: {customer.id}</span>
                      </div>
                      <div className="flex flex-col text-xs text-gray-500 font-subtitles">
                        <span>📧 {customer.email}</span>
                        <span>🆔 CC/NIT: {customer.vat}</span>
                      </div>
                    </button>
                  ))
                ) : odooSearchQuery.length >= 3 && !isSearchingOdoo ? (
                  <div className="py-10 text-center">
                    <p className="text-gray-400 font-subtitles text-sm">No se encontraron clientes que coincidan.</p>
                  </div>
                ) : !odooSearchQuery ? (
                  <div className="py-10 text-center">
                    <p className="text-gray-300 font-subtitles text-sm">Empieza a escribir para buscar...</p>
                  </div>
                ) : null}
              </div>

              {/* Messages */}
              {odooError && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-subtitles">
                  ⚠️ {odooError}
                </div>
              )}
              {odooSuccess && (
                <div className="bg-green-50 text-green-600 text-xs p-3 rounded-xl border border-green-100 font-subtitles animate-bounce">
                  ✅ {odooSuccess}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setIsOdooModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold font-subtitles text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendToOdoo}
                disabled={!selectedCustomer || isSendingToOdoo}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold font-subtitles text-white shadow-lg transition-all ${!selectedCustomer || isSendingToOdoo
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-[#714B67] hover:brightness-110 active:scale-95'
                  }`}
              >
                {isSendingToOdoo ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enviando...
                  </div>
                ) : (
                  'Confirmar Envío'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
