import { useState, useEffect, useRef } from 'react'
import { Location } from '@/types/admin/config'

const PAGE_SIZE = 20

export function CityCombobox({
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
        className={`form-input w-full text-left truncate ${!selectedLoc ? 'text-gray-600' : ''}`}
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
              <p className="text-sm text-gray-600 text-center py-3">Sin resultados</p>
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
                {l.region && <span className="text-xs text-gray-600 shrink-0">{l.region}</span>}
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
