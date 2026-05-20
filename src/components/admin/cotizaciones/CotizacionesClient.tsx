'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/context/AuthContext'
import { useQuotations } from '@/lib/admin/quotations/useQuotations'
import { DestLocation, Office, QuotationTab } from '@/types/admin/quotations'
import { pickupPointsClient } from '@/lib/api-client/pickupPoints'
import { TrendingUp, DollarSign, Calculator, UserCheck, Package } from 'lucide-react'

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

export function CotizacionesClient() {
  const router = useRouter()
  const { token } = useAuth()
  const {
    tab, setTab, pubRecords, pubTotal, pubPage, setPubPage, pubPageSize, setPubPageSize, pubLoading,
    empRecords, empTotal, empPage, setEmpPage, empPageSize, setEmpPageSize, empLoading,
    offices, loadingO, fetchPublica, fetchEmpleados, fetchOffices
  } = useQuotations(token)

  // Stats for Publica
  const pubStats = {
    total: pubTotal,
    avg: pubRecords.length > 0 ? (pubRecords.reduce((s, r) => s + Number(r.total), 0) / pubRecords.length) : 0,
    totalPage: pubRecords.reduce((s, r) => s + Number(r.total), 0)
  }

  // Stats for Empleados
  const empStats = {
    total: empTotal,
    activeEmps: new Set(empRecords.filter(r => r.employee).map(r => r.employee?.id)).size,
    odooIncome: empRecords.filter(r => r.quotation?.odooOrderName).reduce((s, r) => s + Number(r.total), 0)
  }

  const [officeModal, setOfficeModal] = useState(false)
  const [editingOffice, setEditingOffice] = useState<Office | null>(null)
  const [officeForm, setOfficeForm] = useState({ name: '', address: '', latitude: '', longitude: '', coverageRadiusMiles: '' })
  const [savingOffice, setSavingOffice] = useState(false)
  const [officeError, setOfficeError] = useState('')

  const openNewOffice = () => { setEditingOffice(null); setOfficeForm({ name: '', address: '', latitude: '', longitude: '', coverageRadiusMiles: '' }); setOfficeError(''); setOfficeModal(true) }
  const openEditOffice = (o: Office) => { setEditingOffice(o); setOfficeForm({ name: o.name, address: o.address, latitude: String(o.latitude), longitude: String(o.longitude), coverageRadiusMiles: o.coverageRadiusMiles != null ? String(o.coverageRadiusMiles) : '' }); setOfficeError(''); setOfficeModal(true) }

  const saveOffice = async () => {
    if (!officeForm.name.trim() || !officeForm.address.trim()) { setOfficeError('Requeridos'); return }
    setSavingOffice(true)
    try {
      await pickupPointsClient.saveOffice(token, officeForm, editingOffice?.id);
      setOfficeModal(false)
      fetchOffices()
    } catch (error) {
      setOfficeError('Error guardando almacén')
    } finally {
      setSavingOffice(false)
    }
  }

  const toggleOfficeActive = async (o: Office) => {
    try {
      await pickupPointsClient.toggleActive(token, o.id, o.isActive);
      fetchOffices();
    } catch (error) {
      console.error(error);
    }
  }

  const deleteOffice = async (id: number) => {
    if (!confirm('¿Eliminar?')) return
    try {
      await pickupPointsClient.deleteOffice(token, id);
      fetchOffices();
    } catch (error) {
      console.error(error);
    }
  }

  const tabLabels: Record<QuotationTab, string> = { publica: '🌐 Pública', empleados: '👤 Empleados', offices: 'Almacenes' }

  return (
    <DashboardLayout pageTitle="Cotizaciones" navItems={NAV_ITEMS} onReload={tab === 'publica' ? fetchPublica : tab === 'empleados' ? fetchEmpleados : fetchOffices}>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div><h2 className="font-titles text-2xl font-extrabold text-[var(--color-foreground)]">Gestión de Cotizaciones</h2><p className="text-gray-500 text-sm">Cálculos de envío y almacenes</p></div>
          <div className="flex gap-2">
            {/* {tab === 'empleados' && <button onClick={() => router.push('/admin/cotizaciones/nueva')} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold text-sm" aria-label="Nueva cotización">+ Nueva</button>} */}
            {tab === 'offices' && <button onClick={openNewOffice} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold text-sm" aria-label="Nuevo almacén">+ Almacén</button>}
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit" role="tablist">
          {(['publica', 'empleados', 'offices'] as const).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-[var(--color-foreground)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{tabLabels[t]}</button>
          ))}
        </div>

        {tab === 'publica' && (
          <div className="space-y-4" role="tabpanel">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <StatCard title="Total Cotizaciones" value={pubStats.total} icon={Package} color="bg-blue-500" />
              <StatCard title="Promedio por Cálculo" value={fmt(pubStats.avg)} icon={Calculator} color="bg-emerald-500" />
              <StatCard title="Ingresos Página" value={fmt(pubStats.totalPage)} icon={DollarSign} color="bg-amber-500" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table role="grid" aria-label="Data table" className="w-full text-left text-sm">
                  <thead role="rowgroup"><tr role="row" className="bg-gray-50 border-b border-gray-100"><th role="columnheader" className="p-4 text-xs text-gray-600">ID</th><th role="columnheader" className="p-4 text-xs text-gray-600">País</th><th role="columnheader" className="p-4 text-xs text-gray-600">Destino</th><th role="columnheader" className="p-4 text-xs text-gray-600">Cobrable</th><th role="columnheader" className="p-4 text-xs text-gray-600">Total</th><th role="columnheader" className="p-4 text-xs text-gray-600">Fecha</th></tr></thead>
                  <tbody role="rowgroup" className="divide-y divide-gray-50">
                    {pubLoading ? <tr role="row"><td role="gridcell" colSpan={6} className="p-10 text-center text-gray-600 animate-pulse">Cargando...</td></tr> : pubRecords.length === 0 ? <tr role="row"><td role="gridcell" colSpan={6} className="p-10 text-center text-gray-600">Sin datos</td></tr> : pubRecords.map(r => (
                      <tr role="row" key={r.id} className="hover:bg-gray-50"><td role="gridcell" className="p-4 font-bold text-blue-600">#{r.id}</td><td role="gridcell" className="p-4"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.country === 'CO' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{r.country}</span></td><td role="gridcell" className="p-4 truncate max-w-[200px]">{locationLabel(r.destinationLocation)}</td><td role="gridcell" className="p-4 font-mono">{fmtNum(r.chargeableWeightLb)} lb</td><td role="gridcell" className="p-4 font-extrabold">{fmt(r.total)}</td><td role="gridcell" className="p-4 text-xs text-gray-600">{new Date(r.createdAt).toLocaleDateString()}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-50"><Pagination page={pubPage} pageSize={pubPageSize} totalItems={pubTotal} onPageChange={setPubPage} onPageSizeChange={setPubPageSize} /></div>
            </div>
          </div>
        )}

        {tab === 'empleados' && (
          <div className="space-y-4" role="tabpanel">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <StatCard title="Total Cotizaciones" value={empStats.total} icon={Package} color="bg-indigo-500" />
              <StatCard title="Empleados Activos pág." value={empStats.activeEmps} icon={UserCheck} color="bg-purple-500" />
              <StatCard title="Ingresos en Odoo" value={fmt(empStats.odooIncome)} icon={TrendingUp} color="bg-rose-500" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table role="grid" aria-label="Data table" className="w-full text-left text-sm">
                  <thead role="rowgroup"><tr role="row" className="bg-gray-50 border-b border-gray-100"><th role="columnheader" className="p-3 text-xs text-gray-600">ID</th><th role="columnheader" className="p-3 text-xs text-gray-600">Empleado</th><th role="columnheader" className="p-3 text-xs text-gray-600">Destino</th><th role="columnheader" className="p-3 text-xs text-gray-600">Cobrable</th><th role="columnheader" className="p-3 text-xs text-gray-600 font-bold">Total</th><th role="columnheader" className="p-3 text-xs text-gray-600">Odoo</th><th role="columnheader" className="p-3 text-xs text-gray-600">Fecha</th></tr></thead>
                  <tbody role="rowgroup" className="divide-y divide-gray-50">
                    {empLoading ? <tr role="row"><td role="gridcell" colSpan={7} className="p-10 text-center text-gray-600 animate-pulse">Cargando...</td></tr> : empRecords.length === 0 ? <tr role="row"><td role="gridcell" colSpan={7} className="p-10 text-center text-gray-600">Sin datos</td></tr> : empRecords.map(r => (
                      <tr role="row" key={r.id} className="hover:bg-gray-50"><td role="gridcell" className="p-3 font-bold text-indigo-600">#{r.id}</td><td role="gridcell" className="p-3 font-semibold">{r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '—'}</td><td role="gridcell" className="p-3 truncate max-w-[150px]">{locationLabel(r.destinationLocation)}</td><td role="gridcell" className="p-3 font-mono">{fmtNum(r.chargeableWeightLb)} lb</td><td role="gridcell" className="p-3 font-extrabold">{fmt(r.total)}</td><td role="gridcell" className="p-3 text-xs">{r.quotation?.odooCustomerId ? `#${r.quotation.odooCustomerId}` : '—'}</td><td role="gridcell" className="p-3 text-xs text-gray-600">{new Date(r.createdAt).toLocaleDateString()}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-50"><Pagination page={empPage} pageSize={empPageSize} totalItems={empTotal} onPageChange={setEmpPage} onPageSizeChange={setEmpPageSize} /></div>
            </div>
          </div>
        )}

        {tab === 'offices' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" role="tabpanel">
            <table role="grid" aria-label="Data table" className="w-full text-left text-sm">
              <thead role="rowgroup"><tr role="row" className="bg-gray-50 border-b border-gray-100"><th role="columnheader" className="px-5 py-3 text-xs text-gray-600">Almacén</th><th role="columnheader" className="px-5 py-3 text-xs text-gray-600">Dirección</th><th role="columnheader" className="px-5 py-3 text-xs text-gray-600">Estado</th><th role="columnheader" className="px-5 py-3 text-xs text-gray-600 text-right">Acciones</th></tr></thead>
              <tbody role="rowgroup" className="divide-y divide-gray-50">
                {offices.map(o => (
                  <tr role="row" key={o.id} className="hover:bg-gray-50"><td role="gridcell" className="px-5 py-4 font-semibold">{o.name}</td><td role="gridcell" className="px-5 py-4 text-gray-600 truncate max-w-[300px]">{o.address}</td><td role="gridcell" className="px-5 py-4"><button onClick={() => toggleOfficeActive(o)} aria-label={o.isActive ? 'Desactivar almacén' : 'Activar almacén'} className={`text-xs font-bold px-2 py-1 rounded-full ${o.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{o.isActive ? 'Activo' : 'Inactivo'}</button></td><td role="gridcell" className="px-5 py-4 text-right flex justify-end gap-2"><button aria-label="Editar almacén" onClick={() => openEditOffice(o)}>✏️</button><button aria-label="Eliminar almacén" onClick={() => deleteOffice(o.id)}>🗑️</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {officeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">{editingOffice ? 'Editar' : 'Nuevo'} Almacén</h3><button aria-label="Cerrar modal" onClick={() => setOfficeModal(false)}>✕</button></div>
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
            <div className="mt-6 flex justify-end gap-3"><button onClick={() => setOfficeModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-500">Cancelar</button><button onClick={saveOffice} disabled={savingOffice} className="px-4 py-2 text-sm font-bold bg-[var(--color-primary)] text-white rounded-lg">{savingOffice ? '...' : 'Guardar'}</button></div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
