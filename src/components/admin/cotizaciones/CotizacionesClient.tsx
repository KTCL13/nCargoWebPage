'use client'

import { useState } from 'react'
import { ModalShell } from '@/components/ui/ModalShell'
import { useDirtyForm } from '@/hooks/useDirtyForm'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/context/AuthContext'
import { useQuotations } from '@/lib/admin/quotations/useQuotations'
import { CotizacionRecord, DestLocation, Office, QuotationTab } from '@/types/admin/quotations'
import { pickupPointsClient } from '@/lib/api-client/pickupPoints'
import { TrendingUp, DollarSign, Calculator, UserCheck, Package, Pencil, Trash2, AlertTriangle, Lock, MapPin, Loader2 } from 'lucide-react'

const LocationPickerModal = dynamic(
  () => import('@/components/ui/LocationPickerModal').then(m => ({ default: m.LocationPickerModal })),
  { ssr: false },
)

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:translate-y-[-2px]">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon size={20} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{title}</p>
        <p className="text-xl font-extrabold text-[var(--color-foreground)] leading-none">{value}</p>
      </div>
    </div>
  )
}

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

type EditForm = {
  heightIn: string; widthIn: string; lengthIn: string
  actualWeightLb: string; declaredValueUsd: string
}

function hasOdoo(r: CotizacionRecord) {
  return !!(r.quotation?.odooOrderName || r.quotation?.odooCustomerId)
}

export function CotizacionesClient() {
  const router = useRouter()
  const { user, token } = useAuth()
  const {
    tab, setTab, pubRecords, pubTotal, pubPage, setPubPage, pubPageSize, setPubPageSize, pubLoading,
    empRecords, empTotal, empPage, setEmpPage, empPageSize, setEmpPageSize, empLoading,
    deleteEmpRecord, updateEmpRecord,
    offices, loadingO, fetchPublica, fetchEmpleados, fetchOffices
  } = useQuotations(token)

  // ── Stats ────────────────────────────────────────────────────────────────
  const pubStats = {
    total: pubTotal,
    avg: pubRecords.length > 0 ? (pubRecords.reduce((s, r) => s + Number(r.total), 0) / pubRecords.length) : 0,
    totalPage: pubRecords.reduce((s, r) => s + Number(r.total), 0)
  }
  const empStats = {
    total: empTotal,
    activeEmps: new Set(empRecords.filter(r => r.employee).map(r => r.employee?.id)).size,
    odooIncome: empRecords.filter(r => r.quotation?.odooOrderName).reduce((s, r) => s + Number(r.total), 0)
  }

  // ── Employee record actions ───────────────────────────────────────────────
  const [actionRecord, setActionRecord] = useState<CotizacionRecord | null>(null)
  const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | null>(null)

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({ heightIn: '', widthIn: '', lengthIn: '', actualWeightLb: '', declaredValueUsd: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // Odoo warning gate
  const [odooGateOpen, setOdooGateOpen] = useState(false)

  function requestAction(record: CotizacionRecord, type: 'edit' | 'delete') {
    setActionRecord(record)
    setPendingAction(type)
    if (hasOdoo(record)) {
      setOdooGateOpen(true)
    } else {
      openAction(record, type)
    }
  }

  function openAction(record: CotizacionRecord, type: 'edit' | 'delete') {
    if (type === 'delete') {
      setDeleteOpen(true)
    } else {
      setEditForm({
        heightIn:        String(record.heightIn),
        widthIn:         String(record.widthIn),
        lengthIn:        String(record.lengthIn),
        actualWeightLb:  String(record.actualWeightLb),
        declaredValueUsd: String(record.declaredValueUsd),
      })
      setEditError('')
      setEditOpen(true)
    }
  }

  function confirmOdooGate() {
    setOdooGateOpen(false)
    if (actionRecord && pendingAction) openAction(actionRecord, pendingAction)
  }

  async function confirmDelete() {
    if (!actionRecord) return
    setDeleting(true)
    try {
      await deleteEmpRecord(actionRecord.id)
      setDeleteOpen(false)
      setActionRecord(null)
    } catch { } finally { setDeleting(false) }
  }

  async function confirmEdit() {
    if (!actionRecord) return
    setEditSaving(true)
    setEditError('')
    try {
      await updateEmpRecord(actionRecord.id, {
        heightIn:         Number(editForm.heightIn),
        widthIn:          Number(editForm.widthIn),
        lengthIn:         Number(editForm.lengthIn),
        actualWeightLb:   Number(editForm.actualWeightLb),
        declaredValueUsd: Number(editForm.declaredValueUsd),
      })
      setEditOpen(false)
      setActionRecord(null)
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Error al guardar')
    } finally { setEditSaving(false) }
  }

  // ── Office modal ──────────────────────────────────────────────────────────
  const EMPTY_OFFICE_FORM = { name: '', address: '', latitude: '', longitude: '' }
  const [officeModal, setOfficeModal] = useState(false)
  const [editingOffice, setEditingOffice] = useState<Office | null>(null)
  const [officeForm, setOfficeForm] = useState(EMPTY_OFFICE_FORM)
  const [initialOfficeForm, setInitialOfficeForm] = useState(EMPTY_OFFICE_FORM)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodedDisplay, setGeocodedDisplay] = useState('')
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [savingOffice, setSavingOffice] = useState(false)
  const [officeError, setOfficeError] = useState('')

  const resetOfficeModal = () => {
    setGeocoding(false); setGeocodedDisplay(''); setShowLocationPicker(false); setOfficeError('')
  }
  const openNewOffice = () => {
    setEditingOffice(null)
    setOfficeForm(EMPTY_OFFICE_FORM)
    setInitialOfficeForm(EMPTY_OFFICE_FORM)
    resetOfficeModal()
    setOfficeModal(true)
  }
  const openEditOffice = (o: Office) => {
    setEditingOffice(o)
    const snapshot = { name: o.name, address: o.address, latitude: String(o.latitude), longitude: String(o.longitude) }
    setOfficeForm(snapshot)
    setInitialOfficeForm(snapshot)
    setGeocodedDisplay(o.address)
    setGeocoding(false); setShowLocationPicker(false); setOfficeError('')
    setOfficeModal(true)
  }

  const geocodeOfficeAddress = async () => {
    const addr = officeForm.address.trim()
    if (!addr) return
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`,
        { headers: { 'Accept-Language': 'es' } },
      )
      const data = await res.json()
      if (data[0]) {
        setOfficeForm(f => ({ ...f, latitude: data[0].lat, longitude: data[0].lon }))
        setGeocodedDisplay(data[0].display_name)
        setOfficeError('')
      } else {
        setOfficeError('Dirección no encontrada. Intenta con más detalle o selecciona en el mapa.')
      }
    } catch { setOfficeError('Error al geocodificar la dirección.') }
    setGeocoding(false)
  }

  const saveOffice = async () => {
    if (!officeForm.name.trim() || !officeForm.address.trim()) { setOfficeError('Nombre y dirección son requeridos'); return }
    if (!officeForm.latitude || !officeForm.longitude) { setOfficeError('Geocodifica la dirección primero o selecciona en el mapa.'); return }
    setSavingOffice(true)
    try {
      await pickupPointsClient.saveOffice(token, officeForm, editingOffice?.id)
      setOfficeModal(false); fetchOffices()
    } catch { setOfficeError('Error guardando almacén') } finally { setSavingOffice(false) }
  }

  const toggleOfficeActive = async (o: Office) => {
    try { await pickupPointsClient.toggleActive(token, o.id, o.isActive); fetchOffices() } catch (e) { console.error(e) }
  }
  const deleteOffice = async (id: number) => {
    if (!confirm('¿Eliminar este almacén?')) return
    try { await pickupPointsClient.deleteOffice(token, id); fetchOffices() } catch (e) { console.error(e) }
  }

  const isOfficeDirty = useDirtyForm(initialOfficeForm, officeForm)

  const tabLabels: Record<QuotationTab, string> = { publica: '🌐 Pública', empleados: '👤 Empleados', offices: 'Almacenes' }

  return (
    <DashboardLayout pageTitle="Cotizaciones" navItems={NAV_ITEMS} onReload={tab === 'publica' ? fetchPublica : tab === 'empleados' ? fetchEmpleados : fetchOffices}>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-titles text-2xl font-extrabold text-[var(--color-foreground)]">Gestión de Cotizaciones</h2>
            <p className="text-gray-500 text-sm">Cálculos de envío y almacenes</p>
          </div>
          <div className="flex gap-2">
            {tab === 'offices' && <button onClick={openNewOffice} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold text-sm" aria-label="Nuevo almacén">+ Almacén</button>}
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit" role="tablist">
          {(['publica', 'empleados', 'offices'] as const).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-[var(--color-foreground)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {/* ── Tab: Pública ─────────────────────────────────────────────────── */}
        {tab === 'publica' && (
          <div className="space-y-4" role="tabpanel">
            {/* Info banner */}
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-800">
              <Lock size={16} className="shrink-0 mt-0.5 text-blue-500" />
              <div className="text-sm">
                <span className="font-semibold">Registros de solo lectura.</span>
                {' '}Estas cotizaciones son generadas automáticamente cuando un cliente usa la calculadora pública de la landing page.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <StatCard title="Total Cotizaciones" value={pubStats.total} icon={Package} color="bg-blue-500" />
              <StatCard title="Promedio por Cálculo" value={fmt(pubStats.avg)} icon={Calculator} color="bg-emerald-500" />
              <StatCard title="Ingresos Página" value={fmt(pubStats.totalPage)} icon={DollarSign} color="bg-amber-500" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table role="grid" aria-label="Cotizaciones públicas" className="w-full text-left text-sm">
                  <thead role="rowgroup">
                    <tr role="row" className="bg-gray-50 border-b border-gray-100">
                      <th role="columnheader" className="p-4 text-xs font-bold text-gray-500 uppercase">ID</th>
                      <th role="columnheader" className="p-4 text-xs font-bold text-gray-500 uppercase">País</th>
                      <th role="columnheader" className="p-4 text-xs font-bold text-gray-500 uppercase">Destino</th>
                      <th role="columnheader" className="p-4 text-xs font-bold text-gray-500 uppercase">Cobrable</th>
                      <th role="columnheader" className="p-4 text-xs font-bold text-gray-500 uppercase">Total</th>
                      <th role="columnheader" className="p-4 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup" className="divide-y divide-gray-50">
                    {pubLoading ? (
                      <tr role="row"><td role="gridcell" colSpan={6} className="p-10 text-center text-gray-400 animate-pulse">Cargando...</td></tr>
                    ) : pubRecords.length === 0 ? (
                      <tr role="row"><td role="gridcell" colSpan={6} className="p-10 text-center text-gray-400">Sin datos</td></tr>
                    ) : pubRecords.map(r => (
                      <tr role="row" key={r.id} className="hover:bg-gray-50">
                        <td role="gridcell" className="p-4 font-bold text-blue-600">#{r.id}</td>
                        <td role="gridcell" className="p-4">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.country === 'CO' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{r.country}</span>
                        </td>
                        <td role="gridcell" className="p-4 truncate max-w-[200px]">{locationLabel(r.destinationLocation)}</td>
                        <td role="gridcell" className="p-4 font-mono">{fmtNum(r.chargeableWeightLb)} lb</td>
                        <td role="gridcell" className="p-4 font-extrabold">{fmt(r.total)}</td>
                        <td role="gridcell" className="p-4 text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString('es-CO')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-50">
                <Pagination page={pubPage} pageSize={pubPageSize} totalItems={pubTotal} onPageChange={setPubPage} onPageSizeChange={setPubPageSize} />
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Empleados ────────────────────────────────────────────────── */}
        {tab === 'empleados' && (
          <div className="space-y-4" role="tabpanel">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <StatCard title="Total Cotizaciones" value={empStats.total} icon={Package} color="bg-indigo-500" />
              <StatCard title="Empleados Activos pág." value={empStats.activeEmps} icon={UserCheck} color="bg-purple-500" />
              <StatCard title="Ingresos en Odoo" value={fmt(empStats.odooIncome)} icon={TrendingUp} color="bg-rose-500" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table role="grid" aria-label="Cotizaciones de empleados" className="w-full text-left text-sm">
                  <thead role="rowgroup">
                    <tr role="row" className="bg-gray-50 border-b border-gray-100">
                      <th role="columnheader" className="p-3 text-xs font-bold text-gray-500 uppercase">ID</th>
                      <th role="columnheader" className="p-3 text-xs font-bold text-gray-500 uppercase">Empleado</th>
                      <th role="columnheader" className="p-3 text-xs font-bold text-gray-500 uppercase">Destino</th>
                      <th role="columnheader" className="p-3 text-xs font-bold text-gray-500 uppercase">Cobrable</th>
                      <th role="columnheader" className="p-3 text-xs font-bold text-gray-500 uppercase">Total</th>
                      <th role="columnheader" className="p-3 text-xs font-bold text-gray-500 uppercase">Odoo</th>
                      <th role="columnheader" className="p-3 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                      <th role="columnheader" className="p-3 text-xs font-bold text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup" className="divide-y divide-gray-50">
                    {empLoading ? (
                      <tr role="row"><td role="gridcell" colSpan={8} className="p-10 text-center text-gray-400 animate-pulse">Cargando...</td></tr>
                    ) : empRecords.length === 0 ? (
                      <tr role="row"><td role="gridcell" colSpan={8} className="p-10 text-center text-gray-400">Sin datos</td></tr>
                    ) : empRecords.map(r => (
                      <tr role="row" key={r.id} className="hover:bg-gray-50">
                        <td role="gridcell" className="p-3 font-bold text-indigo-600">#{r.id}</td>
                        <td role="gridcell" className="p-3 font-semibold">{r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '—'}</td>
                        <td role="gridcell" className="p-3 truncate max-w-[150px]">{locationLabel(r.destinationLocation)}</td>
                        <td role="gridcell" className="p-3 font-mono">{fmtNum(r.chargeableWeightLb)} lb</td>
                        <td role="gridcell" className="p-3 font-extrabold">{fmt(r.total)}</td>
                        <td role="gridcell" className="p-3 text-xs">
                          {r.quotation?.odooOrderName ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-semibold text-[11px]">
                              🔗 {r.quotation.odooOrderName}
                            </span>
                          ) : r.quotation?.odooCustomerId ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-semibold text-[11px]">
                              #{r.quotation.odooCustomerId}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td role="gridcell" className="p-3 text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString('es-CO')}</td>
                        <td role="gridcell" className="p-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => requestAction(r, 'edit')}
                              aria-label="Editar cotización"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
                            >
                              <Pencil size={12} /> Editar
                            </button>
                            <button
                              onClick={() => requestAction(r, 'delete')}
                              aria-label="Eliminar cotización"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            >
                              <Trash2 size={12} /> Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-50">
                <Pagination page={empPage} pageSize={empPageSize} totalItems={empTotal} onPageChange={setEmpPage} onPageSizeChange={setEmpPageSize} />
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Almacenes ────────────────────────────────────────────────── */}
        {tab === 'offices' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" role="tabpanel">
            <table role="grid" aria-label="Almacenes" className="w-full text-left text-sm">
              <thead role="rowgroup">
                <tr role="row" className="bg-gray-50 border-b border-gray-100">
                  <th role="columnheader" className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Almacén</th>
                  <th role="columnheader" className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Dirección</th>
                  <th role="columnheader" className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Estado</th>
                  <th role="columnheader" className="px-5 py-3 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody role="rowgroup" className="divide-y divide-gray-50">
                {offices.map(o => (
                  <tr role="row" key={o.id} className="hover:bg-gray-50">
                    <td role="gridcell" className="px-5 py-4 font-semibold">{o.name}</td>
                    <td role="gridcell" className="px-5 py-4 text-gray-500 truncate max-w-[300px]">{o.address}</td>
                    <td role="gridcell" className="px-5 py-4">
                      <button
                        onClick={() => toggleOfficeActive(o)}
                        aria-label={o.isActive ? 'Desactivar almacén' : 'Activar almacén'}
                        aria-checked={o.isActive}
                        role="switch"
                        className="inline-flex items-center gap-2 group focus:outline-none"
                      >
                        <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${o.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${o.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                        </span>
                        <span className={`text-xs font-semibold ${o.isActive ? 'text-green-700' : 'text-gray-400'}`}>
                          {o.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </button>
                    </td>
                    <td role="gridcell" className="px-5 py-4 text-right flex justify-end gap-2">
                      <button aria-label="Editar almacén" onClick={() => openEditOffice(o)}>✏️</button>
                      <button aria-label="Eliminar almacén" onClick={() => deleteOffice(o.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Odoo warning gate ──────────────────────────────────────────────── */}
      {odooGateOpen && actionRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="odoo-warn-title">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-orange-600" />
                </div>
                <div>
                  <h3 id="odoo-warn-title" className="font-bold text-gray-900 text-base">Registro vinculado a Odoo</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {actionRecord.quotation?.odooOrderName && <span>Pedido: <strong>{actionRecord.quotation.odooOrderName}</strong></span>}
                    {actionRecord.quotation?.odooCustomerId && !actionRecord.quotation?.odooOrderName && <span>Cliente Odoo: <strong>#{actionRecord.quotation.odooCustomerId}</strong></span>}
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-800 mb-5">
                <strong>Advertencia:</strong> Este registro está vinculado a Odoo.{' '}
                {pendingAction === 'delete'
                  ? 'Al eliminarlo, el pedido en Odoo no se verá afectado pero se perderá la trazabilidad entre ambos sistemas.'
                  : 'El cambio que realices no se sincronizará con Odoo y se perderá la trazabilidad entre ambos sistemas.'}
                {' '}Puedes continuar si estás seguro de que esto es intencional.
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setOdooGateOpen(false); setActionRecord(null); setPendingAction(null) }}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmOdooGate}
                  className="px-4 py-2 text-sm font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors">
                  Continuar de todas formas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
      {deleteOpen && actionRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="del-title">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 id="del-title" className="font-bold text-gray-900 text-base mb-1">Eliminar cotización #{actionRecord.id}</h3>
            <p className="text-sm text-gray-500 mb-5">
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro de cotización.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setDeleteOpen(false); setActionRecord(null) }} disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors">
                {deleting ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Trash2 size={14} />}
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ───────────────────────────────────────────────────────── */}
      {editOpen && actionRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-title">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 id="edit-title" className="font-bold text-gray-900 text-base">Editar cotización #{actionRecord.id}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Los totales calculados reflejarán los nuevos valores al guardar.</p>
              </div>
              <button onClick={() => { setEditOpen(false); setActionRecord(null) }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Alto (in)</label>
                  <input type="number" step="0.01" min="0" value={editForm.heightIn}
                    onChange={e => setEditForm(f => ({ ...f, heightIn: e.target.value }))}
                    className="form-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ancho (in)</label>
                  <input type="number" step="0.01" min="0" value={editForm.widthIn}
                    onChange={e => setEditForm(f => ({ ...f, widthIn: e.target.value }))}
                    className="form-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Largo (in)</label>
                  <input type="number" step="0.01" min="0" value={editForm.lengthIn}
                    onChange={e => setEditForm(f => ({ ...f, lengthIn: e.target.value }))}
                    className="form-input w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Peso real (lb)</label>
                  <input type="number" step="0.01" min="0" value={editForm.actualWeightLb}
                    onChange={e => setEditForm(f => ({ ...f, actualWeightLb: e.target.value }))}
                    className="form-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Valor declarado (USD)</label>
                  <input type="number" step="0.01" min="0" value={editForm.declaredValueUsd}
                    onChange={e => setEditForm(f => ({ ...f, declaredValueUsd: e.target.value }))}
                    className="form-input w-full" />
                </div>
              </div>
              {editError && <p className="text-sm text-red-600">{editError}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => { setEditOpen(false); setActionRecord(null) }} disabled={editSaving}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmEdit} disabled={editSaving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white disabled:opacity-50 transition-opacity">
                {editSaving ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Pencil size={14} />}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Office modal ──────────────────────────────────────────────────── */}
      <ModalShell
        isOpen={officeModal}
        onClose={() => setOfficeModal(false)}
        title={editingOffice ? 'Editar Almacén' : 'Nuevo Almacén'}
        subtitle="Nombre y dirección son requeridos"
        isDirty={isOfficeDirty}
        maxWidth="md"
        footer={
          <button
            onClick={saveOffice}
            disabled={savingOffice}
            className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50"
          >
            {savingOffice ? '...' : 'Guardar'}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del almacén</label>
            <input
              type="text" placeholder="Ej. Almacén Miami" aria-label="Nombre del almacén"
              value={officeForm.name} onChange={e => setOfficeForm(f => ({ ...f, name: e.target.value }))}
              className="form-input w-full" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección</label>
            <div className="flex gap-2">
              <input
                type="text" placeholder="Ej. 1234 NW 72nd Ave, Miami, FL"
                aria-label="Dirección del almacén"
                value={officeForm.address}
                onChange={e => { setOfficeForm(f => ({ ...f, address: e.target.value })); setGeocodedDisplay('') }}
                onKeyDown={e => e.key === 'Enter' && geocodeOfficeAddress()}
                className="form-input flex-1" />
              <button
                onClick={geocodeOfficeAddress}
                disabled={geocoding || !officeForm.address.trim()}
                aria-label="Geocodificar dirección"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-gray-900 text-white disabled:opacity-40 transition-opacity whitespace-nowrap">
                {geocoding
                  ? <Loader2 size={13} className="animate-spin" />
                  : <MapPin size={13} />}
                {geocoding ? 'Buscando…' : 'Geocodificar'}
              </button>
            </div>
          </div>

          {/* Geocode result */}
          {geocodedDisplay && officeForm.latitude && officeForm.longitude && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-green-800 flex items-center gap-1.5">
                <MapPin size={12} className="text-green-600 shrink-0" />
                Ubicación encontrada
              </p>
              <p className="text-xs text-green-700 leading-snug">{geocodedDisplay}</p>
              <p className="font-mono text-[10px] text-green-600">{parseFloat(officeForm.latitude).toFixed(5)}, {parseFloat(officeForm.longitude).toFixed(5)}</p>
              <button
                onClick={() => setShowLocationPicker(true)}
                className="mt-1 self-start text-xs font-semibold text-green-700 underline underline-offset-2 hover:text-green-900 transition-colors">
                ¿No coincide? Ajustar en el mapa →
              </button>
            </div>
          )}

          {/* No coords yet — show map picker shortcut */}
          {!geocodedDisplay && !officeForm.latitude && (
            <button
              onClick={() => setShowLocationPicker(true)}
              className="w-full text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors">
              🗺️ Seleccionar directamente en el mapa
            </button>
          )}

          {officeError && <p className="text-red-500 text-sm">{officeError}</p>}
        </div>
      </ModalShell>

      {/* ── Location picker modal ─────────────────────────────────────────── */}
      {showLocationPicker && (
        <LocationPickerModal
          initialLat={officeForm.latitude}
          initialLng={officeForm.longitude}
          onConfirm={(lat, lng, display) => {
            setOfficeForm(f => ({ ...f, latitude: lat, longitude: lng }))
            setGeocodedDisplay(display)
            setShowLocationPicker(false)
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </DashboardLayout>
  )
}
