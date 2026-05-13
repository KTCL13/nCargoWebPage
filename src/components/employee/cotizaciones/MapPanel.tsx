import dynamic from 'next/dynamic'
import { Office } from '@/lib/employee/cotizaciones/types'

const MapPicker = dynamic(() => import('@/components/ui/MapPicker'), { ssr: false })

interface MapPanelProps {
  offices: Office[]
  origin: Office | null
  setOrigin: (o: Office | null) => void
  onDistanceChange: (miles: number) => void
}

export function MapPanel({ offices, origin, setOrigin, onDistanceChange }: MapPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden flex flex-col relative z-0 h-full min-h-[500px]">
      <div className="px-4 pt-4 pb-2 border-b border-black/5">
        <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/60 block mb-1">
          🏭 Almacén de origen
        </label>
        <select
          value={origin?.id ?? ''}
          onChange={e => setOrigin(offices.find(o => o.id === Number(e.target.value)) ?? null)}
          className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm font-body bg-[#F7F8FA] outline-none focus:border-[var(--color-nc-blue)] transition-colors"
          disabled={offices.length === 0}
        >
          {offices.length === 0
            ? <option>Cargando almacenes...</option>
            : offices.map(o => <option key={o.id} value={o.id}>📦 {o.name}</option>)
          }
        </select>
      </div>

      <MapPicker
        office={origin}
        onDistanceChange={(miles) => onDistanceChange(miles)}
      />
    </div>
  )
}
