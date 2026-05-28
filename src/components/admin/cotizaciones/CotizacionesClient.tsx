'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/context/AuthContext'
import { useQuotations } from '@/lib/admin/quotations/useQuotations'
import { CotizacionRecord, DestLocation, Office, QuotationTab } from '@/types/admin/quotations'
import { pickupPointsClient } from '@/lib/api-client/pickupPoints'
import { TrendingUp, DollarSign, Calculator, UserCheck, Package, Pencil, Trash2, AlertTriangle, Lock } from 'lucide-react'

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
  const [officeModal, setOfficeModal] = useState(false)
  const [editingOffice, setEditingOffice] = useState<Office | null>(null)
  const [officeForm, setOfficeForm] = useState({ name: '', address: '', latitude: '', longitude: '', coverageRadiusMiles: '' })
  const [savingOffice, setSavingOffice] = useState(false)
  const [officeError, setOfficeError] = useState('')

  const openNewOffice = () => { setEditingOffice(null); setOfficeForm({ name: '', address: '', latitude: '', longitude: '', coverageRadiusMiles: '' }); setOfficeError(''); setOfficeModal(true) }
  const openEditOffice = (o: Office) => { setEditingOffice(o); setOfficeForm({ name: o.name, address: o.address, latitude: String(o.latitude), longitude: String(o.longitude), coverageRadiusMiles: o.coverageRadiusMiles != null ? String(o.coverageRadiusMiles) : '' }); setOfficeError(''); setOfficeModal(true) }

  const saveOffice = async () => {
    if (!officeForm.name.trim() || !officeForm.address.trim()) { setOfficeError('Nombre y dirección son requeridos'); return }
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
                Contienen información de clientes potenciales (país, destino, dimensiones, valor declarado) y <span className="font-semibold">no deben editarse</span> para preservar la integridad de los datos de contacto.
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
                      <button onClick={() => toggleOfficeActive(o)} aria-label={o.isActive ? 'Desactivar almacén' : 'Activar almacén'}
                        className={`text-xs font-bold px-2 py-1 rounded-full ${o.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {o.isActive ? 'Activo' : 'Inactivo'}
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
      {officeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editingOffice ? 'Editar' : 'Nuevo'} Almacén</h3>
              <button aria-label="Cerrar modal" onClick={() => setOfficeModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors text-lg">✕</button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Nombre" aria-label="Nombre del almacén" value={officeForm.name} onChange={e => setOfficeForm(f => ({ ...f, name: e.target.value }))} className="form-input w-full" />
              <input type="text" placeholder="Dirección" aria-label="Dirección del almacén" value={officeForm.address} onChange={e => setOfficeForm(f => ({ ...f, address: e.target.value }))} className="form-input w-full" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Latitud" aria-label="Latitud" value={officeForm.latitude} onChange={e => setOfficeForm(f => ({ ...f, latitude: e.target.value }))} className="form-input w-full" />
                <input type="number" placeholder="Longitud" aria-label="Longitud" value={officeForm.longitude} onChange={e => setOfficeForm(f => ({ ...f, longitude: e.target.value }))} className="form-input w-full" />
              </div>
              <input type="number" placeholder="Radio cobertura (mi)" aria-label="Radio de cobertura en millas" value={officeForm.coverageRadiusMiles} onChange={e => setOfficeForm(f => ({ ...f, coverageRadiusMiles: e.target.value }))} className="form-input w-full" />
              {officeError && <p className="text-red-500 text-sm">{officeError}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setOfficeModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700">Cancelar</button>
              <button onClick={saveOffice} disabled={savingOffice} className="px-4 py-2 text-sm font-bold bg-[var(--color-primary)] text-white rounded-lg disabled:opacity-50">{savingOffice ? '...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
