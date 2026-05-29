'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Map as LeafletMap, Marker } from 'leaflet'

interface Props {
  initialLat: string
  initialLng: string
  onConfirm: (lat: string, lng: string, display: string) => void
  onClose: () => void
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'es' } },
    )
    const data = await res.json()
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

function LocationMap({ initialLat, initialLng, onConfirm, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<Marker | null>(null)

  const [picked, setPicked] = useState<{ lat: number; lng: number; display: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const pickedRef = useRef(picked)
  useEffect(() => { pickedRef.current = picked }, [picked])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    const init = async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !containerRef.current) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((containerRef.current as any)._leaflet_id) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const lat = parseFloat(initialLat) || 25.7617
      const lng = parseFloat(initialLng) || -80.1918

      const map = L.map(containerRef.current, { zoomControl: true }).setView([lat, lng], 13)
      if (cancelled) { map.remove(); return }
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      if (parseFloat(initialLat) && parseFloat(initialLng)) {
        const pinIcon = L.divIcon({
          className: '',
          html: `<div style="background:#0f172a;width:20px;height:20px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,.5)"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        })
        markerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(map)
        const display = await reverseGeocode(lat, lng)
        if (!cancelled) setPicked({ lat, lng, display })
      }

      map.on('click', async (e: { latlng: { lat: number; lng: number } }) => {
        const { lat: cLat, lng: cLng } = e.latlng
        markerRef.current?.remove()

        const pinIcon = L.divIcon({
          className: '',
          html: `<div style="background:#2563eb;width:20px;height:20px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,.5)"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        })
        markerRef.current = L.marker([cLat, cLng], { icon: pinIcon }).addTo(map)

        setLoading(true)
        const display = await reverseGeocode(cLat, cLng)
        setLoading(false)
        setPicked({ lat: cLat, lng: cLng, display })
      })
    }

    init()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative" style={{ minHeight: 340 }}>
        <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ cursor: 'crosshair' }} />
        <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-[400] bg-white/95 border border-blue-300 rounded-full px-3 py-1 shadow text-[11px] font-semibold text-blue-700">
          Haz clic en el mapa para seleccionar la ubicación
        </div>
      </div>
      <div className="border-t border-gray-100 px-5 py-4 flex flex-col gap-3 bg-gray-50">
        {loading && <p className="text-xs text-gray-400 animate-pulse">Obteniendo dirección...</p>}
        {picked && !loading && (
          <p className="text-xs text-gray-700">
            <span className="font-semibold">📍 Seleccionado:</span>{' '}
            <span className="text-gray-500">{picked.display}</span>
            <span className="ml-2 font-mono text-[10px] text-gray-400">({picked.lat.toFixed(5)}, {picked.lng.toFixed(5)})</span>
          </p>
        )}
        {!picked && !loading && (
          <p className="text-xs text-gray-400 italic">Haz clic en el mapa para seleccionar la ubicación del almacén.</p>
        )}
        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors">
            Cancelar
          </button>
          <button
            disabled={!picked}
            onClick={() => picked && onConfirm(String(picked.lat), String(picked.lng), picked.display)}
            className="px-4 py-2 text-sm font-bold rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white disabled:opacity-40 transition-opacity">
            Confirmar ubicación
          </button>
        </div>
      </div>
    </div>
  )
}

export function LocationPickerModal({ initialLat, initialLng, onConfirm, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-label="Seleccionar ubicación en mapa">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: 520 }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900">Seleccionar ubicación en mapa</h3>
            <p className="text-xs text-gray-400 mt-0.5">Haz clic en el mapa para ajustar la posición del almacén</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors text-lg">✕</button>
        </div>
        <div className="flex-1 overflow-hidden">
          <LocationMap initialLat={initialLat} initialLng={initialLng} onConfirm={onConfirm} onClose={onClose} />
        </div>
      </div>
    </div>
  )
}
