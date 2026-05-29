import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Office } from '@/types/cotizaciones'

const MapPicker = dynamic(() => import('@/components/ui/MapPicker'), { ssr: false })

interface MapPanelProps {
  offices: Office[]
  origin: Office | null
  setOrigin: (o: Office | null) => void
  onDistanceChange: (miles: number) => void
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function findNearest(lat: number, lng: number, offices: Office[]): Office | null {
  if (!offices.length) return null
  return offices.reduce((best, o) => {
    const d = haversine(lat, lng, parseFloat(String(o.latitude)), parseFloat(String(o.longitude)))
    if (!best) return o
    const dBest = haversine(lat, lng, parseFloat(String(best.latitude)), parseFloat(String(best.longitude)))
    return d < dBest ? o : best
  }, null as Office | null)
}

export function MapPanel({ offices, origin, setOrigin, onDistanceChange }: MapPanelProps) {
  const [clientAddress, setClientAddress] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [autoSelected, setAutoSelected] = useState<string | null>(null)

  const handleGeocode = async () => {
    const addr = clientAddress.trim()
    if (!addr) return
    setGeocoding(true)
    setGeoError('')
    setAutoSelected(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`,
        { headers: { 'Accept-Language': 'es' } },
      )
      const data = await res.json()
      if (!data[0]) { setGeoError('Dirección no encontrada'); setGeocoding(false); return }

      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)

      const nearest = findNearest(lat, lng, offices)
      if (nearest && nearest.id !== origin?.id) {
        setOrigin(nearest)
        setAutoSelected(nearest.name)
      }
    } catch { setGeoError('Error al buscar la dirección') }
    setGeocoding(false)
  }

  const activeOffices = offices.filter(o => o.isActive !== false)

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden flex flex-col relative z-0 h-full min-h-[500px]">
      {/* Client address section */}
      <div className="px-4 pt-4 pb-3 border-b border-black/5 space-y-3">
        <div>
          <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/60 block mb-1">
            📍 Dirección del cliente
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={clientAddress}
              onChange={e => { setClientAddress(e.target.value); setGeoError(''); setAutoSelected(null) }}
              onKeyDown={e => e.key === 'Enter' && handleGeocode()}
              placeholder="Ej. 1234 Main St, Miami, FL"
              className="flex-1 border border-black/15 rounded-lg px-3 py-2 text-sm font-body bg-[#F7F8FA] outline-none focus:border-[var(--color-nc-blue)] transition-colors"
            />
            <button
              onClick={handleGeocode}
              disabled={geocoding || !clientAddress.trim()}
              className="px-3 py-2 bg-[var(--color-nc-dark)] text-white text-sm rounded-lg font-semibold hover:opacity-80 transition-opacity disabled:opacity-40 whitespace-nowrap"
            >
              {geocoding ? '...' : '🔍'}
            </button>
          </div>
          {geoError && <p className="text-xs text-red-500 font-subtitles mt-1">{geoError}</p>}
          {autoSelected && (
            <p className="text-xs text-green-700 font-subtitles mt-1 flex items-center gap-1">
              <span>✓</span>
              <span>Almacén más cercano seleccionado: <strong>{autoSelected}</strong></span>
            </p>
          )}
        </div>

        {/* Warehouse selector */}
        <div>
          <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/60 block mb-1">
            🏭 Almacén de origen
          </label>
          <select
            value={origin?.id ?? ''}
            onChange={e => {
              setAutoSelected(null)
              setOrigin(activeOffices.find(o => o.id === Number(e.target.value)) ?? null)
            }}
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm font-body bg-[#F7F8FA] outline-none focus:border-[var(--color-nc-blue)] transition-colors"
            disabled={activeOffices.length === 0}
          >
            {activeOffices.length === 0
              ? <option>Cargando almacenes...</option>
              : activeOffices.map(o => <option key={o.id} value={o.id}>📦 {o.name}</option>)
            }
          </select>
        </div>
      </div>

      <MapPicker
        office={origin}
        onDistanceChange={(miles) => onDistanceChange(miles)}
      />
    </div>
  )
}
