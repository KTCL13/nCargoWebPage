'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap, Marker, Polyline, LatLng } from 'leaflet'

type Office = {
  id: number
  name: string
  address: string
  latitude: number | string
  longitude: number | string
}

type Props = {
  office: Office | null
  onDistanceChange: (miles: number, destAddress: string) => void
}

// OSRM public routing API — driving directions
async function getRoute(
  from: [number, number],
  to: [number, number],
): Promise<{ coords: [number, number][]; distanceMeters: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
    const res = await fetch(url)
    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.[0]) return null
    const route = data.routes[0]
    const coords: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng],
    )
    return { coords, distanceMeters: route.distance }
  } catch {
    return null
  }
}

// Nominatim geocoder
async function geocode(query: string): Promise<{ lat: number; lng: number; display: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } })
    const data = await res.json()
    if (!data[0]) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name }
  } catch {
    return null
  }
}

const METERS_TO_MILES = 0.000621371

export default function MapPicker({ office, onDistanceChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const originMarkerRef = useRef<Marker | null>(null)
  const destMarkerRef = useRef<Marker | null>(null)
  const routeLineRef = useRef<Polyline | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [searching, setSearching] = useState(false)
  const [routeInfo, setRouteInfo] = useState<{ miles: number; address: string } | null>(null)
  const [searchError, setSearchError] = useState('')

  // Build and place route on map
  const drawRoute = async (destLat: number, destLng: number, destAddress: string) => {
    if (!mapRef.current || !office) return
    const L = (await import('leaflet')).default

    const originLat = parseFloat(String(office.latitude))
    const originLng = parseFloat(String(office.longitude))

    // Remove previous route + dest marker
    routeLineRef.current?.remove()
    destMarkerRef.current?.remove()

    const destIcon = L.divIcon({
      className: '',
      html: `<div style="background:#e11d48;width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 18],
    })

    destMarkerRef.current = L.marker([destLat, destLng], { icon: destIcon })
      .addTo(mapRef.current)
      .bindPopup(`<b>Destino</b><br/>${destAddress}`)
      .openPopup()

    const route = await getRoute([originLat, originLng], [destLat, destLng])
    if (route) {
      routeLineRef.current = L.polyline(route.coords, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.8,
      }).addTo(mapRef.current)

      mapRef.current.fitBounds(routeLineRef.current.getBounds(), { padding: [40, 40] })

      const miles = parseFloat((route.distanceMeters * METERS_TO_MILES).toFixed(2))
      setRouteInfo({ miles, address: destAddress })
      onDistanceChange(miles, destAddress)
    } else {
      // No route found, still place marker and calculate straight-line distance
      const toRad = (d: number) => (d * Math.PI) / 180
      const R = 3958.8 // Earth radius in miles
      const dLat = toRad(destLat - originLat)
      const dLng = toRad(destLng - originLng)
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(originLat)) * Math.cos(toRad(destLat)) * Math.sin(dLng / 2) ** 2
      const miles = parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2))
      setRouteInfo({ miles, address: destAddress })
      onDistanceChange(miles, destAddress)
    }
  }

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let map: LeafletMap

    const init = async () => {
      const L = (await import('leaflet')).default

      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const lat = office ? parseFloat(String(office.latitude)) : 25.7617
      const lng = office ? parseFloat(String(office.longitude)) : -80.1918

      map = L.map(containerRef.current!, { zoomControl: true }).setView([lat, lng], 13)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      if (office) {
        const originIcon = L.divIcon({
          className: '',
          html: `<div style="background:#0f172a;width:20px;height:20px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,.5)"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        })
        originMarkerRef.current = L.marker([lat, lng], { icon: originIcon, zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup(`<b>🏭 ${office.name}</b><br/>${office.address}`)
          .openPopup()
      }

      // Click to pick destination
      map.on('click', async (e: { latlng: LatLng }) => {
        const { lat: dLat, lng: dLng } = e.latlng
        // Reverse geocode for display address
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${dLat}&lon=${dLng}`,
            { headers: { 'Accept-Language': 'es' } },
          )
          const data = await res.json()
          const addr = data.display_name ?? `${dLat.toFixed(5)}, ${dLng.toFixed(5)}`
          drawRoute(dLat, dLng, addr)
        } catch {
          drawRoute(dLat, dLng, `${dLat.toFixed(5)}, ${dLng.toFixed(5)}`)
        }
      })
    }

    init()

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update origin marker when office changes
  useEffect(() => {
    if (!mapRef.current || !office) return
    const updateOrigin = async () => {
      const L = (await import('leaflet')).default
      originMarkerRef.current?.remove()
      const lat = parseFloat(String(office.latitude))
      const lng = parseFloat(String(office.longitude))
      const originIcon = L.divIcon({
        className: '',
        html: `<div style="background:#0f172a;width:20px;height:20px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,.5)"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 20],
      })
      originMarkerRef.current = L.marker([lat, lng], { icon: originIcon, zIndexOffset: 1000 })
        .addTo(mapRef.current!)
        .bindPopup(`<b>🏭 ${office.name}</b><br/>${office.address}`)
      mapRef.current!.setView([lat, lng], 13)
      // Clear destination if office changes
      destMarkerRef.current?.remove()
      routeLineRef.current?.remove()
      setRouteInfo(null)
    }
    updateOrigin()
  }, [office])

  const handleSearch = async () => {
    if (!searchInput.trim()) return
    setSearching(true)
    setSearchError('')
    const result = await geocode(searchInput)
    setSearching(false)
    if (!result) {
      setSearchError('Dirección no encontrada')
      return
    }
    drawRoute(result.lat, result.lng, result.display)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 border-b border-black/5 flex flex-col gap-2">
        <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)] flex items-center gap-1.5">
          📍 Seleccionar Punto de Recogida
        </p>
        <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50">
          Haz clic en el mapa o busca la dirección de recogida
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Ej. 1234 Main St, Miami, FL"
            className="flex-1 border border-black/15 rounded-lg px-3 py-2 text-sm font-body bg-[#F7F8FA] outline-none focus:border-[var(--color-nc-blue)] transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-3 py-2 bg-[var(--color-nc-dark)] text-white text-sm rounded-lg font-semibold hover:opacity-80 transition-opacity disabled:opacity-50 whitespace-nowrap"
          >
            {searching ? '...' : '🔍'}
          </button>
        </div>
        {searchError && <p className="text-xs text-red-500 font-subtitles">{searchError}</p>}
      </div>

      {/* Map container */}
      <div ref={containerRef} className="flex-1 min-h-[300px] w-full" />

      {/* Footer: office address + route info */}
      <div className="px-4 py-3 border-t border-black/5 bg-[#F7F8FA] flex flex-col gap-1.5">
        {office && (
          <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/60 flex items-center gap-1.5">
            🏭 <span className="font-semibold">{office.name}</span> — {office.address}
          </p>
        )}
        {routeInfo && (
          <div className="flex items-center justify-between">
            <p className="font-subtitles text-xs text-blue-700 font-semibold flex items-center gap-1.5">
              🛣️ Ruta calculada: <span className="text-blue-900">{routeInfo.miles} mi</span>
            </p>
            <a
              href={`https://maps.google.com/maps?saddr=${encodeURIComponent(office?.address ?? '')}&daddr=${encodeURIComponent(routeInfo.address)}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-subtitles font-semibold text-white bg-[var(--color-nc-dark)] px-3 py-1.5 rounded-lg hover:bg-[var(--color-nc-blue)] transition-colors whitespace-nowrap"
            >
              🧭 Cómo llegar
            </a>
          </div>
        )}
        {!routeInfo && (
          <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/40 italic">
            Haz clic en el mapa para calcular la ruta de recogida
          </p>
        )}
      </div>
    </div>
  )
}
