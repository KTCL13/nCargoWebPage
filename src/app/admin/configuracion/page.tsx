'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useAuth } from '@/context/AuthContext'

type Rate = {
  id: number
  destination: { id: number; city: string; region: string | null; country: string }
  basePrice: number
  pricePerLb: number
}
type Location = { id: number; city: string; region: string | null; country: string }
type ConfigEntry = { key: string; value: unknown; description: string | null }

const CLS = {
  card: 'bg-white rounded-xl p-5 mb-6 shadow',
  grid: 'grid grid-cols-2 md:grid-cols-3 gap-4',
  input: 'form-input w-full',
  btn: 'px-3 py-2 rounded text-white text-sm',
  label: 'text-sm text-gray-600 font-medium',
}

const CONFIG_LABELS: Record<string, string> = {
  divisor:               'Divisor peso volumétrico (in³/lb)',
  insurance_rate:        'Tasa seguro (ej. 0.10 = 10%)',
  customs_rate:          'Arancel aduanal >$200 (ej. 0.31)',
  customs_threshold:     'Umbral aduanas (USD)',
  pickup_base:           'Costo base recogida (USD)',
  pickup_per_extra_mile: 'Costo por milla extra (USD)',
  pickup_free_miles:     'Millas incluidas en base',
}

const FLAT_RATE_KEYS = new Set([
  'co_flat_rate_enabled', 'co_flat_rate_price',
  'mx_flat_rate_enabled', 'mx_flat_rate_price',
])

const PAGE_SIZE = 20

// ── CityCombobox ─────────────────────────────────────────────────────────────

function CityCombobox({
  locations,
  value,
  onChange,
}: {
  locations: Location[]
  value: string
  onChange: (id: string) => void
}) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const filtered   = locations.filter(l =>
    `${l.city} ${l.region ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const pageCount  = Math.ceil(filtered.length / PAGE_SIZE)
  const visible    = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const selectedLoc = locations.find(l => String(l.id) === value)
  const triggerLabel = selectedLoc
    ? `${selectedLoc.city}${selectedLoc.region ? ` — ${selectedLoc.region}` : ''}`
    : 'Seleccionar ciudad...'

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(''); setPage(0) }}
        className={`${CLS.input} text-left truncate ${!selectedLoc ? 'text-gray-400' : ''}`}
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b">
            <input
              autoFocus
              type="text"
              placeholder="Buscar ciudad..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto divide-y">
            {visible.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-3">Sin resultados</p>
            )}
            {visible.map(l => (
              <button
                key={l.id}
                type="button"
                onClick={() => { onChange(String(l.id)); setOpen(false) }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex justify-between items-baseline gap-2 ${
                  String(l.id) === value ? 'bg-blue-50' : ''
                }`}
              >
                <span className="text-sm font-medium truncate">{l.city}</span>
                {l.region && <span className="text-xs text-gray-400 shrink-0">{l.region}</span>}
              </button>
            ))}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50 text-xs text-gray-500">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-40"
              >
                ‹ Anterior
              </button>
              <span>{page + 1} / {pageCount}</span>
              <button
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-40"
              >
                Siguiente ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── RatesTable ───────────────────────────────────────────────────────────────

const TABLE_PAGE_SIZE = 20

function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const left  = Math.max(1, current - 1)
  const right = Math.min(total - 2, current + 1)
  const items: (number | '...')[] = [0]
  if (left > 1) items.push('...')
  for (let i = left; i <= right; i++) items.push(i)
  if (right < total - 2) items.push('...')
  items.push(total - 1)
  return items
}

function RatesTable({
  rates,
  locations,
  newRate,
  onNewRateChange,
  onSaveRate,
  onDeleteRate,
  onAddRate,
  addSaving,
}: {
  rates: Rate[]
  locations: Location[]
  newRate: { destId: string; price: string }
  onNewRateChange: (r: { destId: string; price: string }) => void
  onSaveRate: (id: number, price: number) => Promise<void>
  onDeleteRate: (id: number) => void
  onAddRate: () => void
  addSaving: boolean
}) {
  const [sortField, setSortField] = useState<'city' | 'region' | 'price'>('city')
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('asc')
  const [page,      setPage]      = useState(0)
  const [search,    setSearch]    = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [editing,   setEditing]   = useState<Record<number, string>>({})
  const [saved,     setSaved]     = useState<Set<number>>(new Set())
  const [savingRow, setSavingRow] = useState<number | null>(null)

  const departments = useMemo(
    () => [...new Set(rates.map(r => r.destination.region).filter(Boolean))].sort() as string[],
    [rates],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const result = rates.filter(r => {
      const matchSearch = !q
        || r.destination.city.toLowerCase().includes(q)
        || (r.destination.region ?? '').toLowerCase().includes(q)
      const matchDept = !deptFilter || r.destination.region === deptFilter
      return matchSearch && matchDept
    })
    return [...result].sort((a, b) => {
      let va: string | number
      let vb: string | number
      if (sortField === 'city')   { va = a.destination.city;              vb = b.destination.city }
      else if (sortField === 'region') { va = a.destination.region ?? ''; vb = b.destination.region ?? '' }
      else                        { va = Number(a.basePrice);             vb = Number(b.basePrice) }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  }, [rates, search, deptFilter, sortField, sortDir])

  const pageCount = Math.ceil(filtered.length / TABLE_PAGE_SIZE)
  const pageItems = filtered.slice(page * TABLE_PAGE_SIZE, (page + 1) * TABLE_PAGE_SIZE)
  const dirtyCount = Object.keys(editing).length
  const showStart  = filtered.length === 0 ? 0 : page * TABLE_PAGE_SIZE + 1
  const showEnd    = Math.min((page + 1) * TABLE_PAGE_SIZE, filtered.length)

  function toggleSort(field: 'city' | 'region' | 'price') {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
    setPage(0)
  }

  async function handleSave(rateId: number) {
    const price = Number(editing[rateId])
    if (isNaN(price)) return
    setSavingRow(rateId)
    try {
      await onSaveRate(rateId, price)
      setEditing(prev => { const next = { ...prev }; delete next[rateId]; return next })
      setSaved(prev => new Set(prev).add(rateId))
      setTimeout(() => setSaved(prev => { const next = new Set(prev); next.delete(rateId); return next }), 2000)
    } finally {
      setSavingRow(null)
    }
  }

  function handleDiscard(rateId: number) {
    setEditing(prev => { const next = { ...prev }; delete next[rateId]; return next })
  }

  const thCls = 'px-3 py-2.5 text-left text-[11px] font-bold text-[#8b949e] uppercase tracking-wider cursor-pointer select-none hover:text-[#c9d1d9] transition-colors whitespace-nowrap'
  const arrow  = (f: string) => sortField === f ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'
  const pageBtnCls = 'px-2 py-1 text-xs rounded bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#c9d1d9] disabled:opacity-30 disabled:pointer-events-none transition-colors'
  const numInputCls = 'w-20 px-2 py-1 text-sm font-mono rounded bg-[#0d1117] border border-[#30363d] text-[#3fb950] outline-none focus:border-[#1f6feb] transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#30363d] bg-[#161b22]">
        <div className="relative flex-1 min-w-[160px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e] text-base pointer-events-none">⌕</span>
          <input
            type="text"
            placeholder="Buscar ciudad o departamento..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-8 pr-7 py-1.5 text-sm rounded-md bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] placeholder-[#484f58] outline-none focus:border-[#1f6feb] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#c9d1d9] text-base leading-none"
            >×</button>
          )}
        </div>

        {departments.length > 0 && (
          <select
            value={deptFilter}
            onChange={e => { setDeptFilter(e.target.value); setPage(0) }}
            className="py-1.5 px-3 text-sm rounded-md bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] outline-none focus:border-[#1f6feb] transition-colors"
          >
            <option value="">Todos los departamentos</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}

        <span className="text-xs text-[#8b949e] whitespace-nowrap">
          {filtered.length === 0 ? 'Sin resultados' : `${showStart}–${showEnd} de ${filtered.length.toLocaleString('es-CO')}`}
        </span>

        <span className={`ml-auto px-2 py-1 rounded text-xs font-semibold ${
          dirtyCount > 0
            ? 'bg-[#b08800]/20 text-[#e3b341] border border-[#b08800]/40'
            : 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40'
        }`}>
          {dirtyCount > 0 ? `${dirtyCount} sin guardar` : 'Todo guardado'}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#30363d] bg-[#161b22]">
              <th className="w-10 px-3 py-2.5 text-[11px] font-bold text-[#8b949e] uppercase tracking-wider text-center">#</th>
              <th className={thCls} onClick={() => toggleSort('city')}>Ciudad{arrow('city')}</th>
              <th className={thCls} onClick={() => toggleSort('region')}>Departamento{arrow('region')}</th>
              <th className={thCls} onClick={() => toggleSort('price')}>Precio USD{arrow('price')}</th>
              <th className="px-3 py-2.5 text-[11px] font-bold text-[#8b949e] uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262d]">
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#484f58] text-sm">
                  Sin resultados
                </td>
              </tr>
            )}
            {pageItems.map((rate, idx) => {
              const isDirty  = rate.id in editing
              const isSaved  = saved.has(rate.id)
              const isSaving = savingRow === rate.id

              return (
                <tr
                  key={rate.id}
                  className={`transition-colors ${
                    isDirty  ? 'bg-[#1c2128] border-l-2 border-l-[#e3b341]' :
                    isSaved  ? 'bg-[#0f2a1a] border-l-2 border-l-[#3fb950]' :
                    idx % 2 === 0 ? 'bg-[#0d1117] hover:bg-[#161b22]' : 'bg-[#0a0e14] hover:bg-[#161b22]'
                  }`}
                >
                  <td className="px-3 py-2 text-center text-[11px] text-[#484f58] tabular-nums">
                    {page * TABLE_PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-3 py-2 font-semibold text-[#c9d1d9]">
                    {rate.destination.city}
                  </td>
                  <td className="px-3 py-2 text-[#8b949e]">
                    {rate.destination.region ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[#3fb950] font-mono text-xs font-bold shrink-0">$</span>
                      <input
                        type="number"
                        step="0.5"
                        value={isDirty ? editing[rate.id] : String(rate.basePrice)}
                        onChange={e => setEditing(prev => ({ ...prev, [rate.id]: e.target.value }))}
                        className={numInputCls}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1.5">
                      {isSaved && !isDirty ? (
                        <span className="text-xs text-[#3fb950] font-semibold">✓ Guardado</span>
                      ) : isDirty ? (
                        <>
                          <button
                            onClick={() => handleSave(rate.id)}
                            disabled={isSaving}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white disabled:opacity-50 transition-colors"
                          >
                            {isSaving ? '...' : 'Guardar'}
                          </button>
                          <button
                            onClick={() => handleDiscard(rate.id)}
                            disabled={isSaving}
                            className="px-2 py-1 text-xs rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] disabled:opacity-50 transition-colors"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-[#484f58] text-xs select-none">—</span>
                          <button
                            onClick={() => onDeleteRate(rate.id)}
                            title="Eliminar tarifa"
                            className="w-6 h-6 flex items-center justify-center text-xs rounded text-[#6e7681] hover:text-[#f85149] hover:bg-[#21262d] transition-colors"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-[#30363d] bg-[#161b22]">
          <span className="text-xs text-[#8b949e]">Página {page + 1} de {pageCount}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0} className={pageBtnCls}>«</button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className={pageBtnCls}>‹</button>

            {buildPageRange(page, pageCount).map((p, i) =>
              p === '...'
                ? <span key={`el-${i}`} className="px-1 text-xs text-[#484f58]">…</span>
                : <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-7 h-7 text-xs rounded transition-colors ${
                      p === page
                        ? 'bg-[#1f6feb] text-white font-semibold'
                        : 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#c9d1d9]'
                    }`}
                  >
                    {(p as number) + 1}
                  </button>
            )}

            <button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1} className={pageBtnCls}>›</button>
            <button onClick={() => setPage(pageCount - 1)} disabled={page >= pageCount - 1} className={pageBtnCls}>»</button>
          </div>
        </div>
      )}

      {/* Add new rate */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-[#30363d] bg-[#161b22]">
        <CityCombobox
          locations={locations}
          value={newRate.destId}
          onChange={id => onNewRateChange({ ...newRate, destId: id })}
        />
        <div className="flex items-center gap-1">
          <span className="text-[#3fb950] font-mono text-sm font-bold">$</span>
          <input
            type="number"
            placeholder="0.00"
            step="0.5"
            value={newRate.price}
            onChange={e => onNewRateChange({ ...newRate, price: e.target.value })}
            className={numInputCls}
          />
        </div>
        <button
          onClick={onAddRate}
          disabled={addSaving || !newRate.destId || !newRate.price}
          className="px-3 py-1.5 text-sm font-semibold rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          {addSaving ? '...' : '➕ Agregar'}
        </button>
      </div>
    </div>
  )
}

// ── ConfiguracionPage ─────────────────────────────────────────────────────────

const CONTRACT_CONFIG_KEYS = [
  { key: 'smlv',                   label: 'SMLV – Salario Mínimo Legal Vigente',        hint: 'Salario mensual mínimo legal. Los contratos no pueden tener un salario inferior.',  step: '1',    prefix: '$' },
  { key: 'min_hourly_rate',        label: 'Tarifa mínima por hora',                      hint: 'Valor mínimo permitido para la tarifa horaria en cualquier contrato.',              step: '0.01', prefix: '$' },
  { key: 'daily_hours',            label: 'Jornada diaria legal (horas)',                 hint: 'Número de horas que constituyen la jornada laboral ordinaria. Ej: 8.',             step: '0.5',  prefix: ''  },
  { key: 'extra_hour_multiplier',  label: 'Multiplicador hora extra',                    hint: 'Factor que se aplica sobre la tarifa hora al calcular horas extras. Ej: 1.5.',     step: '0.01', prefix: ''  },
]

export default function ConfiguracionPage() {
  const { token } = useAuth()

  const authHeader = {
    Authorization: `Bearer ${token ?? ''}`,
    'Content-Type': 'application/json',
  }

  const [activeTab, setActiveTab] = useState<'cotizaciones' | 'contratos'>('cotizaciones')

  const [providers,     setProviders]     = useState<{ id: number; name: string }[]>([])
  const [coRates,       setCoRates]       = useState<Rate[]>([])
  const [mxRates,       setMxRates]       = useState<Rate[]>([])
  const [coLocations,   setCoLocations]   = useState<Location[]>([])
  const [mxLocations,   setMxLocations]   = useState<Location[]>([])
  const [configs,       setConfigs]       = useState<ConfigEntry[]>([])
  const [coFlatEnabled, setCoFlatEnabled] = useState(false)
  const [coFlatPrice,   setCoFlatPrice]   = useState('0')
  const [mxFlatEnabled, setMxFlatEnabled] = useState(true)
  const [mxFlatPrice,   setMxFlatPrice]   = useState('5')
  const [loading,       setLoading]       = useState(true)
  const [ratesLoading,  setRatesLoading]  = useState(false)
  const [saving,        setSaving]        = useState<string | null>(null)
  const [newRate,       setNewRate]       = useState({ co: { destId: '', price: '' }, mx: { destId: '', price: '' } })
  const [providerId,    setProviderId]    = useState<number | null>(null)
  const [contractCfg,   setContractCfg]   = useState<Record<string, string>>({})
  const [savingCfgKey,  setSavingCfgKey]  = useState<string | null>(null)

  const loadRates = useCallback(async (pid: number) => {
    setRatesLoading(true)
    try {
      const [rateRes, coLocRes, mxLocRes] = await Promise.all([
        fetch(`/api/shipping-providers/${pid}/rates`, { headers: authHeader }).then(r => r.json()),
        fetch('/api/locations?country=CO', { headers: authHeader }).then(r => r.json()),
        fetch('/api/locations?country=MX', { headers: authHeader }).then(r => r.json()),
      ])

      const all: Rate[] = rateRes.data ?? []
      const co = all.filter(r => r.destination.country === 'CO')
      const mx = all.filter(r => r.destination.country === 'MX')
      setCoRates(co)
      setMxRates(mx)

      const coRateDestIds = new Set(co.map(r => r.destination.id))
      const mxRateDestIds = new Set(mx.map(r => r.destination.id))
      setCoLocations((coLocRes.data ?? []).filter((l: Location) => !coRateDestIds.has(l.id)))
      setMxLocations((mxLocRes.data ?? []).filter((l: Location) => !mxRateDestIds.has(l.id)))
      setNewRate({ co: { destId: '', price: '' }, mx: { destId: '', price: '' } })
    } finally {
      setRatesLoading(false)
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [provRes, cfgRes] = await Promise.all([
        fetch('/api/shipping-providers', { headers: authHeader }).then(r => r.json()),
        fetch('/api/system-config').then(r => r.json()),
      ])

      const provList: { id: number; name: string }[] = provRes.data ?? []
      setProviders(provList)

      const pid: number | null = provList[0]?.id ?? null
      setProviderId(pid)

      const cfgMap: Record<string, unknown> = {}
      for (const { key, value } of cfgRes.data ?? []) cfgMap[key] = value
      setCoFlatEnabled(Boolean(cfgMap['co_flat_rate_enabled']))
      setCoFlatPrice(String(cfgMap['co_flat_rate_price'] ?? '0'))
      setMxFlatEnabled(Boolean(cfgMap['mx_flat_rate_enabled']))
      setMxFlatPrice(String(cfgMap['mx_flat_rate_price'] ?? '5'))

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

      if (pid) await loadRates(pid)
    } finally {
      setLoading(false)
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const handleProviderChange = async (pid: number) => {
    setProviderId(pid)
    await loadRates(pid)
  }

  const patchConfig = async (key: string, value: unknown) => {
    await fetch(`/api/system-config/${key}`, {
      method: 'PATCH',
      headers: authHeader,
      body: JSON.stringify({ value }),
    })
  }

  const saveFlatRate = async (country: 'co' | 'mx') => {
    const enabled = country === 'co' ? coFlatEnabled : mxFlatEnabled
    const price   = country === 'co' ? coFlatPrice   : mxFlatPrice
    setSaving(`flat-${country}`)
    try {
      await patchConfig(`${country}_flat_rate_enabled`, enabled)
      await patchConfig(`${country}_flat_rate_price`, Number(price))
      alert(`Tarifa plana ${country.toUpperCase()} guardada`)
    } catch { alert('Error al guardar') }
    finally { setSaving(null) }
  }

  const saveRate = async (rateId: number, price: number) => {
    if (!providerId) return
    await fetch(`/api/shipping-providers/${providerId}/rates/${rateId}`, {
      method: 'PATCH',
      headers: authHeader,
      body: JSON.stringify({ basePrice: price }),
    })
  }

  const deleteRate = async (rateId: number) => {
    if (!providerId || !confirm('¿Eliminar esta tarifa?')) return
    await fetch(`/api/shipping-providers/${providerId}/rates/${rateId}`, {
      method: 'DELETE',
      headers: authHeader,
    })
    if (providerId) loadRates(providerId)
  }

  const addRate = async (country: 'co' | 'mx') => {
    if (!providerId) return
    const { destId, price } = newRate[country]
    if (!destId || !price) return
    setSaving(`add-${country}`)
    try {
      await fetch(`/api/shipping-providers/${providerId}/rates`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ destinationId: Number(destId), basePrice: Number(price) }),
      })
      loadRates(providerId)
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

  const RatesSection = ({
    country,
    rates,
    locations,
    flatEnabled,
    flatPrice,
    setFlat,
    setFlatPrice,
  }: {
    country: 'co' | 'mx'
    rates: Rate[]
    locations: Location[]
    flatEnabled: boolean
    flatPrice: string
    setFlat: (v: boolean) => void
    setFlatPrice: (v: string) => void
  }) => (
    <div className={`${CLS.card} !p-0 overflow-hidden`}>
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h3 className="font-bold">
          {country === 'co' ? '🇨🇴 Tarifas USA → Colombia' : '🇲🇽 Tarifas USA → México'}
        </h3>
      </div>

      {/* Flat rate toggle */}
      <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={flatEnabled}
            onChange={e => setFlat(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-semibold">Tarifa plana</span>
        </label>
        {flatEnabled && (
          <input
            type="number"
            value={flatPrice}
            onChange={e => setFlatPrice(e.target.value)}
            className={`${CLS.input} w-28`}
            placeholder="USD"
            step="0.01"
          />
        )}
        <button
          onClick={() => saveFlatRate(country)}
          disabled={saving === `flat-${country}`}
          className={`${CLS.btn} bg-green-600 disabled:opacity-50`}
        >
          {saving === `flat-${country}` ? '...' : '💾 Guardar'}
        </button>
      </div>

      {/* City rates table */}
      {!flatEnabled && (
        <div className="p-4">
          <RatesTable
            rates={rates}
            locations={locations}
            newRate={newRate[country]}
            onNewRateChange={r => setNewRate(p => ({ ...p, [country]: r }))}
            onSaveRate={saveRate}
            onDeleteRate={id => deleteRate(id)}
            onAddRate={() => addRate(country)}
            addSaving={saving === `add-${country}`}
          />
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <DashboardLayout pageTitle="Configuración" navItems={NAV_ITEMS}>
        <p className="text-gray-400 animate-pulse">Cargando configuración...</p>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Configuración" navItems={NAV_ITEMS} onReload={load}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-gray-500 text-sm">Gestión de tarifas, variables de contratos y constantes globales</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {([['cotizaciones', '📦 Cotizaciones'], ['contratos', '📄 Variables de Contratos']] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Cotizaciones tab ── */}
      {activeTab === 'cotizaciones' && (
        <>
          {/* Provider selector */}
          <div className="flex items-center gap-3 mb-5">
            <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Proveedor de envío:</label>
            <div className="flex gap-2 flex-wrap">
              {providers.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  disabled={ratesLoading}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
                    providerId === p.id
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  } disabled:opacity-50`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            {ratesLoading && <span className="text-xs text-gray-400 animate-pulse">Cargando tarifas...</span>}
          </div>

          <RatesSection
            country="co"
            rates={coRates}
            locations={coLocations}
            flatEnabled={coFlatEnabled}
            flatPrice={coFlatPrice}
            setFlat={setCoFlatEnabled}
            setFlatPrice={setCoFlatPrice}
          />

          <RatesSection
            country="mx"
            rates={mxRates}
            locations={mxLocations}
            flatEnabled={mxFlatEnabled}
            flatPrice={mxFlatPrice}
            setFlat={setMxFlatEnabled}
            setFlatPrice={setMxFlatPrice}
          />

          <div className={CLS.card}>
            <h3 className="font-bold mb-4">⚙️ Constantes Globales</h3>
            <div className={CLS.grid}>
              {configs.map(({ key, value }) => (
                <div key={key as string} className="flex flex-col gap-1">
                  <label className={CLS.label}>{CONFIG_LABELS[key as string]}</label>
                  <div className="flex gap-1">
                    <input
                      className={`${CLS.input} flex-1`}
                      type="number"
                      step="any"
                      defaultValue={String(value)}
                      id={`cfg-${key}`}
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById(`cfg-${key}`) as HTMLInputElement
                        if (el) saveConfig(key as string, el.value)
                      }}
                      disabled={saving === `cfg-${key}`}
                      className={`${CLS.btn} bg-green-600 disabled:opacity-50`}
                    >
                      {saving === `cfg-${key}` ? '...' : '✓'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Contratos tab ── */}
      {activeTab === 'contratos' && (
        <div className={CLS.card}>
          <h3 className="font-bold mb-1">📄 Variables de Contratos</h3>
          <p className="text-sm text-gray-500 mb-6">
            Estos valores se usan para validar los contratos al momento de crearlos. Si un contrato no cumple con el mínimo, el sistema lo rechazará.
          </p>

          <div className="flex flex-col gap-6">
            {CONTRACT_CONFIG_KEYS.map(({ key, label, hint, step, prefix }) => (
              <div key={key} className="flex flex-col gap-1.5 max-w-sm">
                <label className="text-sm font-semibold text-gray-700">{label}</label>
                <p className="text-xs text-gray-400">{hint}</p>
                <div className="flex gap-2 items-center mt-1">
                  {prefix && <span className="text-gray-500 font-mono font-bold">{prefix}</span>}
                  <input
                    type="number"
                    step={step}
                    min="0"
                    value={contractCfg[key] ?? ''}
                    placeholder="Sin configurar"
                    onChange={e => setContractCfg(prev => ({ ...prev, [key]: e.target.value }))}
                    className={`${CLS.input} flex-1`}
                  />
                  <button
                    onClick={() => saveContractCfg(key)}
                    disabled={savingCfgKey === key || !contractCfg[key]}
                    className={`${CLS.btn} bg-green-600 disabled:opacity-50 whitespace-nowrap`}
                  >
                    {savingCfgKey === key ? '...' : '💾 Guardar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
