'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/context/AuthContext'

const LIMIT = 10

type Tab = 'publica' | 'empleados' | 'offices'

type DestLocation = {
  name: string
  type: string
  parent: { name: string; parent: { name: string } | null } | null
} | null

type CotizacionRecord = {
  id: number
  country: string
  heightIn: string
  widthIn: string
  lengthIn: string
  actualWeightLb: string
  volumetricWeightLb: string
  chargeableWeightLb: string
  declaredValueUsd: string
  pickupMiles: string | null
  transport: string
  volumetricSurcharge: string
  insurance: string
  customs: string
  cityDelivery: string
  pickup: string
  total: string
  flatRateApplied: boolean
  createdAt: string
  employee: { id: number; firstName: string; lastName: string } | null
  destinationLocation: DestLocation
  quotation: { id: number; odooCustomerId: number | null; odooOrderName: string | null; status: string } | null
}

type Office = {
  id: number
  name: string
  address: string
  latitude: number | string
  longitude: number | string
  coverageRadiusMiles: number | string | null
  isActive: boolean
}

const emptyOfficeForm = { name: '', address: '', latitude: '', longitude: '', coverageRadiusMiles: '' }

function locationLabel(loc: DestLocation): string {
  if (!loc) return '—'
  const dept = loc.parent?.name ?? ''
  const country = loc.parent?.parent?.name ?? ''
  return [loc.name, dept, country].filter(Boolean).join(', ')
}

function fmt(val: string | number | null | undefined): string {
  if (val == null) return '—'
  const n = Number(val)
  return isNaN(n) ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtNum(val: string | number | null | undefined, decimals = 2): string {
  if (val == null) return '—'
  const n = Number(val)
  return isNaN(n) ? '—' : n.toFixed(decimals)
}

export default function CotizacionesPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [tab, setTab] = useState<Tab>('publica')

  // ── Pública state ──
  const [pubRecords, setPubRecords] = useState<CotizacionRecord[]>([])
  const [pubTotal, setPubTotal] = useState(0)
  const [pubPage, setPubPage] = useState(0)
  const [pubPageSize, setPubPageSize] = useState(LIMIT)
  const [pubLoading, setPubLoading] = useState(false)

  // ── Empleados state ──
  const [empRecords, setEmpRecords] = useState<CotizacionRecord[]>([])
  const [empTotal, setEmpTotal] = useState(0)
  const [empPage, setEmpPage] = useState(0)
  const [empPageSize, setEmpPageSize] = useState(LIMIT)
  const [empLoading, setEmpLoading] = useState(false)

  // ── Offices state ──
  const [offices, setOffices] = useState<Office[]>([])
  const [loadingO, setLoadingO] = useState(false)
  const [officeModal, setOfficeModal] = useState(false)
  const [editingOffice, setEditingOffice] = useState<Office | null>(null)
  const [officeForm, setOfficeForm] = useState(emptyOfficeForm)
  const [savingOffice, setSavingOffice] = useState(false)
  const [officeError, setOfficeError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // ── Fetches ──
  const fetchPublica = useCallback(async () => {
    setPubLoading(true)
    try {
      const res = await fetch(`/api/cotizacion-records?source=PUBLIC&page=${pubPage + 1}&pageSize=${pubPageSize}`)
      const data = await res.json()
      setPubRecords(data.data ?? [])
      setPubTotal(data.total ?? 0)
    } catch { /* ignore */ } finally { setPubLoading(false) }
  }, [pubPage, pubPageSize])

  const fetchEmpleados = useCallback(async () => {
    setEmpLoading(true)
    try {
      const res = await fetch(`/api/cotizacion-records?source=EMPLOYEE&page=${empPage + 1}&pageSize=${empPageSize}`)
      const data = await res.json()
      setEmpRecords(data.data ?? [])
      setEmpTotal(data.total ?? 0)
    } catch { /* ignore */ } finally { setEmpLoading(false) }
  }, [empPage, empPageSize])

  const fetchOffices = useCallback(async () => {
    setLoadingO(true)
    try {
      const res = await fetch('/api/pickup-points')
      const data = await res.json()
      setOffices(data.data ?? [])
    } catch { /* ignore */ } finally { setLoadingO(false) }
  }, [])

  useEffect(() => { if (tab === 'publica') fetchPublica() }, [tab, fetchPublica])
  useEffect(() => { if (tab === 'empleados') fetchEmpleados() }, [tab, fetchEmpleados])
  useEffect(() => { if (tab === 'offices') fetchOffices() }, [tab, fetchOffices])

  // ── Office actions ──
  const openNewOffice = () => { setEditingOffice(null); setOfficeForm(emptyOfficeForm); setOfficeError(''); setOfficeModal(true) }

  const openEditOffice = (o: Office) => {
    setEditingOffice(o)
    setOfficeForm({ name: o.name, address: o.address, latitude: String(o.latitude), longitude: String(o.longitude), coverageRadiusMiles: o.coverageRadiusMiles != null ? String(o.coverageRadiusMiles) : '' })
    setOfficeError('')
    setOfficeModal(true)
  }

  const saveOffice = async () => {
    setOfficeError('')
    if (!officeForm.name.trim() || !officeForm.address.trim() || !officeForm.latitude || !officeForm.longitude) {
      setOfficeError('Nombre, dirección, latitud y longitud son requeridos')
      return
    }
    setSavingOffice(true)
    try {
      const body = { name: officeForm.name, address: officeForm.address, latitude: parseFloat(officeForm.latitude), longitude: parseFloat(officeForm.longitude), coverageRadiusMiles: officeForm.coverageRadiusMiles ? parseFloat(officeForm.coverageRadiusMiles) : null }
      const res = await fetch(editingOffice ? `/api/pickup-points?id=${editingOffice.id}` : '/api/pickup-points', { method: editingOffice ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setOfficeError(data.message || 'Error guardando'); return }
      setOfficeModal(false)
      fetchOffices()
    } catch { setOfficeError('Error de red') } finally { setSavingOffice(false) }
  }

  const toggleOfficeActive = async (o: Office) => {
    try {
      await fetch(`/api/pickup-points?id=${o.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ isActive: !o.isActive }) })
      fetchOffices()
    } catch { /* ignore */ }
  }

  const deleteOffice = async (id: number) => {
    if (!confirm('¿Eliminar este almacén?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/pickup-points?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      fetchOffices()
    } catch { /* ignore */ } finally { setDeletingId(null) }
  }

  // ── KPIs ──
  const pubRevenue = pubRecords.reduce((a, c) => a + Number(c.total), 0)
  const pubAvg = pubRecords.length ? (pubRevenue / pubRecords.length).toFixed(2) : '0'

  const empRevenue = empRecords.reduce((a, c) => a + Number(c.total), 0)
  const empAvg = empRecords.length ? (empRevenue / empRecords.length).toFixed(2) : '0'
  const empOdooSent = empRecords.filter(r => r.quotation?.odooCustomerId != null)
  const empOdooRevenue = empOdooSent.reduce((a, c) => a + Number(c.total), 0)
  const empUniqueEmployees = new Set(empRecords.map(r => r.employee?.id).filter(Boolean)).size

  const tabLabels: Record<Tab, string> = { publica: '🌐 Pública', empleados: '👤 Empleados', offices: '🏭 Almacenes' }

  return (
    <DashboardLayout pageTitle="Cotizaciones" navItems={NAV_ITEMS} onReload={tab === 'publica' ? fetchPublica : tab === 'empleados' ? fetchEmpleados : fetchOffices}>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-titles text-2xl font-extrabold text-[var(--color-foreground)]">Gestión de Cotizaciones</h2>
            <p className="text-gray-500 text-sm">Visualiza y gestiona los cálculos de envío</p>
          </div>
          {tab === 'empleados' && (
            <button onClick={() => router.push('/admin/cotizaciones/nueva')} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold text-sm">
              + Nueva Cotización
            </button>
          )}
          {tab === 'offices' && (
            <button onClick={openNewOffice} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold text-sm">
              + Nuevo Almacén
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {(['publica', 'empleados', 'offices'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold font-subtitles transition-all ${tab === t ? 'bg-white text-[var(--color-foreground)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {/* ── Pública tab ── */}
        {tab === 'publica' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Total Cotizaciones" value={pubTotal} icon="🌐" color="bg-blue-500" />
              <StatCard title="Promedio por Cálculo" value={`$${Number(pubAvg).toLocaleString()}`} icon="📊" color="bg-purple-500" />
              <StatCard title="Ingresos Página (pág.)" value={`$${pubRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon="💰" color="bg-green-600" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-4 text-xs text-gray-400">ID</th>
                      <th className="p-4 text-xs text-gray-400">País</th>
                      <th className="p-4 text-xs text-gray-400">Destino</th>
                      <th className="p-4 text-xs text-gray-400">Dimensiones (in)</th>
                      <th className="p-4 text-xs text-gray-400">Peso real / cobrable</th>
                      <th className="p-4 text-xs text-gray-400">Total</th>
                      <th className="p-4 text-xs text-gray-400">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pubLoading ? (
                      <tr><td colSpan={7} className="p-10 text-center text-gray-400 animate-pulse">Cargando...</td></tr>
                    ) : pubRecords.length === 0 ? (
                      <tr><td colSpan={7} className="p-10 text-center text-gray-400">No hay cotizaciones públicas</td></tr>
                    ) : pubRecords.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-mono text-sm font-bold text-blue-600">#{r.id}</td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.country === 'CO' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {r.country}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-700 max-w-[200px] truncate">{locationLabel(r.destinationLocation)}</td>
                        <td className="p-4 text-xs text-gray-500 font-mono">
                          {fmtNum(r.heightIn)} × {fmtNum(r.widthIn)} × {fmtNum(r.lengthIn)}
                        </td>
                        <td className="p-4 text-xs text-gray-600">
                          <div><span className="text-gray-400">Real:</span> {fmtNum(r.actualWeightLb)} lbs</div>
                          <div><span className="text-gray-400">Cobr.:</span> <b>{fmtNum(r.chargeableWeightLb)} lbs</b></div>
                        </td>
                        <td className="p-4 font-extrabold text-gray-900">{fmt(r.total)}</td>
                        <td className="p-4 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('es-CO')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-50">
                <Pagination
                  page={pubPage}
                  pageSize={pubPageSize}
                  totalItems={pubTotal}
                  onPageChange={setPubPage}
                  onPageSizeChange={(size) => {
                    setPubPageSize(size)
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Empleados tab ── */}
        {tab === 'empleados' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Total Cotizaciones" value={empTotal} icon="👤" color="bg-indigo-500" />
              <StatCard title="Empleados activos (pág.)" value={empUniqueEmployees} icon="👥" color="bg-orange-500" />
              <StatCard title="Ingresos enviados a Odoo" value={`$${empOdooRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon="💰" color="bg-green-600" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-3 text-xs text-gray-400">ID</th>
                      <th className="p-3 text-xs text-gray-400">Empleado</th>
                      <th className="p-3 text-xs text-gray-400">País</th>
                      <th className="p-3 text-xs text-gray-400">Destino</th>
                      <th className="p-3 text-xs text-gray-400">Cobrable</th>
                      <th className="p-3 text-xs text-gray-400">Transporte</th>
                      <th className="p-3 text-xs text-gray-400">Vol.</th>
                      <th className="p-3 text-xs text-gray-400">Seguro</th>
                      <th className="p-3 text-xs text-gray-400">Aduanas</th>
                      <th className="p-3 text-xs text-gray-400">Ciudad</th>
                      <th className="p-3 text-xs text-gray-400">Recogida</th>
                      <th className="p-3 text-xs text-gray-400 font-bold">Total</th>
                      <th className="p-3 text-xs text-gray-400">Cliente Odoo</th>
                      <th className="p-3 text-xs text-gray-400">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {empLoading ? (
                      <tr><td colSpan={14} className="p-10 text-center text-gray-400 animate-pulse">Cargando...</td></tr>
                    ) : empRecords.length === 0 ? (
                      <tr><td colSpan={14} className="p-10 text-center text-gray-400">No hay cotizaciones de empleados</td></tr>
                    ) : empRecords.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 transition">
                        <td className="p-3 font-mono text-xs font-bold text-indigo-600">#{r.id}</td>
                        <td className="p-3 text-xs">
                          {r.employee
                            ? <span className="font-semibold">{r.employee.firstName} {r.employee.lastName}</span>
                            : <span className="text-gray-400 italic">—</span>}
                        </td>
                        <td className="p-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.country === 'CO' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {r.country}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-gray-600 max-w-[150px] truncate">{locationLabel(r.destinationLocation)}</td>
                        <td className="p-3 text-xs font-mono text-gray-700">{fmtNum(r.chargeableWeightLb)} lb</td>
                        <td className="p-3 text-xs text-gray-700">{fmt(r.transport)}</td>
                        <td className="p-3 text-xs text-gray-500">{fmt(r.volumetricSurcharge)}</td>
                        <td className="p-3 text-xs text-gray-500">{fmt(r.insurance)}</td>
                        <td className="p-3 text-xs text-gray-500">{fmt(r.customs)}</td>
                        <td className="p-3 text-xs text-gray-500">{fmt(r.cityDelivery)}</td>
                        <td className="p-3 text-xs text-gray-500">{fmt(r.pickup)}</td>
                        <td className="p-3 font-extrabold text-gray-900 whitespace-nowrap">{fmt(r.total)}</td>
                        <td className="p-3 text-xs whitespace-nowrap">
                          {r.quotation?.odooCustomerId != null ? (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                              #{r.quotation.odooCustomerId}
                              {r.quotation.odooOrderName && <span className="text-blue-400 font-normal">· {r.quotation.odooOrderName}</span>}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-xs text-gray-400 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString('es-CO')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-50">
                <Pagination
                  page={empPage}
                  pageSize={empPageSize}
                  totalItems={empTotal}
                  onPageChange={setEmpPage}
                  onPageSizeChange={(size) => setEmpPageSize(size)}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Almacenes tab ── */}
        {tab === 'offices' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loadingO ? (
              <div className="p-10 text-center text-gray-400 animate-pulse">Cargando almacenes...</div>
            ) : offices.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <p className="text-4xl mb-3">🏭</p>
                <p className="font-semibold">No hay almacenes registrados</p>
                <p className="text-sm mt-1">Agrega el primer punto de recogida</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-xs uppercase text-gray-400 font-subtitles tracking-wide">Almacén</th>
                    <th className="px-5 py-3 text-xs uppercase text-gray-400 font-subtitles tracking-wide">Dirección</th>
                    <th className="px-5 py-3 text-xs uppercase text-gray-400 font-subtitles tracking-wide">Coordenadas</th>
                    <th className="px-5 py-3 text-xs uppercase text-gray-400 font-subtitles tracking-wide">Cobertura</th>
                    <th className="px-5 py-3 text-xs uppercase text-gray-400 font-subtitles tracking-wide">Estado</th>
                    <th className="px-5 py-3 text-xs uppercase text-gray-400 font-subtitles tracking-wide text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {offices.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-sm text-gray-900">{o.name}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 max-w-[220px] truncate">{o.address}</td>
                      <td className="px-5 py-4 text-xs text-gray-500 font-mono">
                        <div>{Number(o.latitude).toFixed(5)}</div>
                        <div>{Number(o.longitude).toFixed(5)}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{o.coverageRadiusMiles != null ? `${o.coverageRadiusMiles} mi` : '—'}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => toggleOfficeActive(o)} className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${o.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          {o.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditOffice(o)} className="p-1.5 text-gray-400 hover:text-[var(--color-primary)] hover:bg-red-50 rounded-lg transition-all" title="Editar">✏️</button>
                          <button onClick={() => deleteOffice(o.id)} disabled={deletingId === o.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40" title="Eliminar">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Office modal ── */}
      {officeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-titles text-lg font-bold text-[var(--color-foreground)]">{editingOffice ? 'Editar Almacén' : 'Nuevo Almacén'}</h3>
              <button onClick={() => setOfficeModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {officeError && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{officeError}</div>}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre del almacén *</label>
                <input type="text" placeholder="Ej. Miami — Almacén Principal" value={officeForm.name} onChange={e => setOfficeForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Dirección *</label>
                <input type="text" placeholder="Ej. 7950 NW 53rd St, Miami, FL 33166" value={officeForm.address} onChange={e => setOfficeForm(f => ({ ...f, address: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Latitud *</label>
                  <input type="number" step="any" placeholder="25.7617" value={officeForm.latitude} onChange={e => setOfficeForm(f => ({ ...f, latitude: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Longitud *</label>
                  <input type="number" step="any" placeholder="-80.1918" value={officeForm.longitude} onChange={e => setOfficeForm(f => ({ ...f, longitude: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Radio de cobertura (millas)</label>
                <input type="number" step="any" placeholder="Opcional" value={officeForm.coverageRadiusMiles} onChange={e => setOfficeForm(f => ({ ...f, coverageRadiusMiles: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] transition-colors" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setOfficeModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
              <button onClick={saveOffice} disabled={savingOffice} className="px-4 py-2 text-sm font-bold text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                {savingOffice && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editingOffice ? 'Guardar cambios' : 'Crear almacén'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-xl text-white`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-400 font-bold uppercase">{title}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  )
}