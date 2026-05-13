import { Country, Dimensions, CityItem } from '@/types/cotizaciones'

interface CalculatorFormProps {
  country: Country
  setCountry: (c: Country) => void
  citiesLoading: boolean
  flatRate: { enabled: boolean; price: number }
  departments: string[]
  dept: string
  setDept: (d: string) => void
  filteredCities: CityItem[]
  cityId: string
  setCityId: (id: string) => void
  weight: string
  setWeight: (w: string) => void
  volWeight: number
  dims: Dimensions
  setDims: (dims: (prev: Dimensions) => Dimensions) => void
  valor: string
  setValor: (v: string) => void
  millas: string
  setMillas: (m: string) => void
  setError: (e: string) => void
  setResult: (r: any) => void
}

const inp = 'border border-black/15 rounded-lg px-3 py-2 text-sm font-body outline-none focus:border-[var(--color-nc-blue)] transition-colors bg-white w-full'

export function CalculatorForm({
  country, setCountry, citiesLoading, flatRate, departments, dept, setDept,
  filteredCities, cityId, setCityId, weight, setWeight, volWeight, dims, setDims,
  valor, setValor, millas, setMillas, setError, setResult
}: CalculatorFormProps) {
  return (
    <div className="flex flex-col gap-5">
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
          <input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="ej. 100" min="0" max="200" className={inp} />
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
        {parseFloat(millas) > 0 && (
          <span className="ml-auto text-[10px] font-subtitles text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
            🗺️ desde mapa
          </span>
        )}
      </div>
    </div>
  )
}
