'use client'
import { useEffect, useMemo, useState } from 'react'

type Country = 'CO' | 'MX'
type City = { id: number; city: string; department: string | null }

export function Calculator() {
  const [country,       setCountry]       = useState<Country>('CO')
  const [allCities,     setAllCities]     = useState<City[]>([])
  const [flatRate,      setFlatRate]      = useState<{ enabled: boolean; price: number }>({ enabled: false, price: 0 })
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [dept,          setDept]          = useState('')
  const [cityId,        setCityId]        = useState('')
  const [dims,          setDims]          = useState({ h: '', w: '', l: '' })
  const [weight,        setWeight]        = useState('')
  const [declared,      setDeclared]      = useState('')
  const [pickup,        setPickup]        = useState('0')
  const [total,         setTotal]         = useState<number | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')

  const parse = (v: string) => parseFloat(v.replace(',', '.')) || 0
  const volWeight = Math.ceil((parse(dims.h) * parse(dims.w) * parse(dims.l)) / 153)

  // Fetch all cities whenever country changes
  useEffect(() => {
    setCitiesLoading(true)
    setTotal(null)
    setError('')
    setDept('')
    setCityId('')
    fetch(`/api/cotizaciones/ciudades?country=${country}`)
      .then(r => r.json())
      .then(data => {
        setAllCities(data.data ?? [])
        setFlatRate({ enabled: Boolean(data.flatRateEnabled), price: Number(data.flatRatePrice) })
      })
      .catch(() => {})
      .finally(() => setCitiesLoading(false))
  }, [country])

  // Unique sorted departments derived from allCities
  const departments = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    for (const c of allCities) {
      const d = c.department ?? ''
      if (d && !seen.has(d)) { seen.add(d); list.push(d) }
    }
    return list.sort()
  }, [allCities])

  // Cities filtered by selected department
  const filteredCities = useMemo(
    () => dept ? allCities.filter(c => c.department === dept) : [],
    [allCities, dept],
  )

  const handleCalc = async () => {
    if (!weight || !dims.h || !dims.w || !dims.l || declared === '') {
      setError('Completa peso, dimensiones y valor declarado')
      return
    }
    if (!flatRate.enabled && !cityId) {
      setError('Selecciona un departamento y una ciudad')
      return
    }
    setError('')
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        country,
        actualWeightLb:   parse(weight),
        heightIn:         parse(dims.h),
        lengthIn:         parse(dims.l),
        widthIn:          parse(dims.w),
        declaredValueUsd: parse(declared),
        pickupMiles:      parse(pickup),
      }
      if (!flatRate.enabled && cityId) body.destinationCityId = Number(cityId)

      const res = await fetch('/api/cotizaciones/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message ?? 'Error al calcular'); return }
      setTotal(data.total)
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }

  const isValid = weight && dims.h && dims.w && dims.l && declared !== '' && (flatRate.enabled || cityId)

  const inp = 'w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-[var(--shadow-sm)] outline-none focus:border-[var(--color-secondary)] focus:ring-2 focus:ring-blue-100'
  const lbl = 'mb-0.5 block text-[9px] font-extrabold uppercase tracking-widest text-slate-600'
  const sec = 'rounded-[var(--radius-md)] border border-slate-200 bg-white p-2'

  return (
    <section className="w-full max-w-md mx-auto rounded-[24px] border border-slate-200 bg-white shadow-[var(--shadow-md)]">
      <div className="px-4 pt-3">
        <h2 className="text-base font-black uppercase text-[var(--color-foreground)]">Calcular envío</h2>
      </div>
      <div className="p-3">
        <div className="mb-3 grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-[var(--radius-md)]">
          {(['CO', 'MX'] as Country[]).map(c => (
            <button
              key={c}
              onClick={() => { setCountry(c); setTotal(null); setError('') }}
              className={`py-1 text-xs font-bold rounded-[var(--radius-sm)] ${country === c ? 'bg-[var(--color-secondary)] text-white' : 'text-slate-600'}`}
            >
              {c === 'CO' ? '🇨🇴 Colombia' : '🇲🇽 México'}
            </button>
          ))}
        </div>

        <div className="grid gap-2">
          {!flatRate.enabled && (
            <div className={sec}>
              {citiesLoading ? (
                <p className="text-xs text-slate-400">Cargando ciudades...</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={lbl}>Departamento</label>
                    <select
                      value={dept}
                      onChange={e => { setDept(e.target.value); setCityId(''); setError('') }}
                      className={inp}
                    >
                      <option value="">Seleccionar</option>
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Ciudad</label>
                    <select
                      value={cityId}
                      onChange={e => { setCityId(e.target.value); setError('') }}
                      className={inp}
                      disabled={!dept}
                    >
                      <option value="">{dept ? 'Seleccionar' : '— elige depto —'}</option>
                      {filteredCities.map(c => (
                        <option key={c.id} value={c.id}>{c.city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {flatRate.enabled && (
            <div className={`${sec} text-xs text-slate-500`}>
              Ciudad: tarifa única USD {flatRate.price.toFixed(2)}
            </div>
          )}

          <div className={sec}>
            <label className={lbl}>Dimensiones (pulgadas)</label>
            <div className="grid grid-cols-3 gap-1">
              {(['h', 'w', 'l'] as const).map(k => {
                const labels = { h: 'Alto', w: 'Ancho', l: 'Largo' }
                return (
                  <div key={k}>
                    <span className="block text-center text-[8px] text-slate-500">{labels[k]}</span>
                    <input
                      value={dims[k]}
                      onChange={e => /^[0-9.,]*$/.test(e.target.value) && setDims(p => ({ ...p, [k]: e.target.value }))}
                      className={`${inp} text-center`}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div className={sec}>
            <div className="grid grid-cols-2 gap-1">
              <div>
                <label className={lbl}>Peso (lb)</label>
                <input
                  value={weight}
                  onChange={e => /^[0-9.,]*$/.test(e.target.value) && setWeight(e.target.value)}
                  className={inp}
                />
              </div>
              <div className="bg-slate-50 rounded-[var(--radius-md)] flex flex-col justify-center items-center text-xs">
                <span className="text-[8px] text-slate-500">Vol (lb)</span>
                <span className="font-black text-[var(--color-secondary)]">{volWeight}</span>
              </div>
            </div>
          </div>

          <div className={sec}>
            <div className="grid grid-cols-2 gap-1">
              <div>
                <label className={lbl}>Valor declarado (USD)</label>
                <input
                  type="number"
                  value={declared}
                  onChange={e => setDeclared(e.target.value)}
                  className={inp}
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label className={lbl}>Millas recogida</label>
                <input
                  type="number"
                  value={pickup}
                  onChange={e => setPickup(e.target.value)}
                  className={inp}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-[10px] text-[var(--color-danger)] font-semibold px-1">{error}</p>}

          <button
            onClick={handleCalc}
            disabled={!isValid || loading}
            className={`btn-primary w-full py-2 text-xs font-bold transition-opacity ${(!isValid || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Calculando...' : 'Calcular'}
          </button>

          {total !== null && (
            <div className="mt-2 p-3 rounded-[var(--radius-lg)] text-white text-center bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)]">
              <p className="text-[9px] uppercase tracking-widest opacity-75 mb-1">Total estimado</p>
              <p className="text-lg font-black">USD {total.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
