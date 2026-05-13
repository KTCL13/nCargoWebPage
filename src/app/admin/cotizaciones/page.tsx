'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/context/AuthContext'
import { useQuotations } from '@/lib/admin/quotations/useQuotations'
import { DestLocation, Office, QuotationTab } from '@/types/admin/quotations'

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
  const {
    tab, setTab, pubRecords, pubTotal, pubPage, setPubPage, pubPageSize, setPubPageSize, pubLoading,
    empRecords, empTotal, empPage, setEmpPage, empPageSize, setEmpPageSize, empLoading,
    offices, loadingO, fetchPublica, fetchEmpleados, fetchOffices
  } = useQuotations(token)

  // Office actions (simplified for the refactor)
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
      const res = await fetch(editingOffice ? `/api/pickup-points?id=${editingOffice.id}` : '/api/pickup-points', {
        method: editingOffice ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...officeForm, latitude: parseFloat(officeForm.latitude), longitude: parseFloat(officeForm.longitude), coverageRadiusMiles: officeForm.coverageRadiusMiles ? parseFloat(officeForm.coverageRadiusMiles) : null })
      })
      if (res.ok) { setOfficeModal(false); fetchOffices() }
    } finally { setSavingOffice(false) }
  }

  const toggleOfficeActive = async (o: Office) => {
    await fetch(`/api/pickup-points?id=${o.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ isActive: !o.isActive }) })
    fetchOffices()
  }

  const deleteOffice = async (id: number) => {
    if (!confirm('¿Eliminar?')) return
    await fetch(`/api/pickup-points?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    fetchOffices()
  }

  const tabLabels: Record<QuotationTab, string> = { publica: '🌐 Pública', empleados: '👤 Empleados', offices: 'Almacenes' }

  return (
    <DashboardLayout pageTitle="Cotizaciones" navItems={NAV_ITEMS} onReload={tab === 'publica' ? fetchPublica : tab === 'empleados' ? fetchEmpleados : fetchOffices}>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div><h2 className="font-titles text-2xl font-extrabold text-[var(--color-foreground)]">Gestión de Cotizaciones</h2><p className="text-gray-500 text-sm">Cálculos de envío y almacenes</p></div>
          <div className="flex gap-2">
            {tab === 'empleados' && <button onClick={() => router.push('/admin/cotizaciones/nueva')} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold text-sm">+ Nueva</button>}
            {tab === 'offices' && <button onClick={openNewOffice} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold text-sm">+ Almacén</button>}
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {(['publica', 'empleados', 'offices'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-[var(--color-foreground)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{tabLabels[t]}</button>
          ))}
        </div>

        {tab === 'publica' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="p-4 text-xs text-gray-400">ID</th><th className="p-4 text-xs text-gray-400">País</th><th className="p-4 text-xs text-gray-400">Destino</th><th className="p-4 text-xs text-gray-400">Cobrable</th><th className="p-4 text-xs text-gray-400">Total</th><th className="p-4 text-xs text-gray-400">Fecha</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {pubLoading ? <tr><td colSpan={6} className="p-10 text-center text-gray-400 animate-pulse">Cargando...</td></tr> : pubRecords.length === 0 ? <tr><td colSpan={6} className="p-10 text-center text-gray-400">Sin datos</td></tr> : pubRecords.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50"><td className="p-4 font-bold text-blue-600">#{r.id}</td><td className="p-4"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.country === 'CO' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{r.country}</span></td><td className="p-4 truncate max-w-[200px]">{locationLabel(r.destinationLocation)}</td><td className="p-4 font-mono">{fmtNum(r.chargeableWeightLb)} lb</td><td className="p-4 font-extrabold">{fmt(r.total)}</td><td className="p-4 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-50"><Pagination page={pubPage} pageSize={pubPageSize} totalItems={pubTotal} onPageChange={setPubPage} onPageSizeChange={setPubPageSize} /></div>
          </div>
        )}

        {tab === 'empleados' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="p-3 text-xs text-gray-400">ID</th><th className="p-3 text-xs text-gray-400">Empleado</th><th className="p-3 text-xs text-gray-400">Destino</th><th className="p-3 text-xs text-gray-400">Cobrable</th><th className="p-3 text-xs text-gray-400 font-bold">Total</th><th className="p-3 text-xs text-gray-400">Odoo</th><th className="p-3 text-xs text-gray-400">Fecha</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {empLoading ? <tr><td colSpan={7} className="p-10 text-center text-gray-400 animate-pulse">Cargando...</td></tr> : empRecords.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-gray-400">Sin datos</td></tr> : empRecords.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50"><td className="p-3 font-bold text-indigo-600">#{r.id}</td><td className="p-3 font-semibold">{r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '—'}</td><td className="p-3 truncate max-w-[150px]">{locationLabel(r.destinationLocation)}</td><td className="p-3 font-mono">{fmtNum(r.chargeableWeightLb)} lb</td><td className="p-3 font-extrabold">{fmt(r.total)}</td><td className="p-3 text-xs">{r.quotation?.odooCustomerId ? `#${r.quotation.odooCustomerId}` : '—'}</td><td className="p-3 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-50"><Pagination page={empPage} pageSize={empPageSize} totalItems={empTotal} onPageChange={setEmpPage} onPageSizeChange={setEmpPageSize} /></div>
          </div>
        )}

        {tab === 'offices' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="px-5 py-3 text-xs text-gray-400">Almacén</th><th className="px-5 py-3 text-xs text-gray-400">Dirección</th><th className="px-5 py-3 text-xs text-gray-400">Estado</th><th className="px-5 py-3 text-xs text-gray-400 text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {offices.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50"><td className="px-5 py-4 font-semibold">{o.name}</td><td className="px-5 py-4 text-gray-600 truncate max-w-[300px]">{o.address}</td><td className="px-5 py-4"><button onClick={() => toggleOfficeActive(o)} className={`text-xs font-bold px-2 py-1 rounded-full ${o.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{o.isActive ? 'Activo' : 'Inactivo'}</button></td><td className="px-5 py-4 text-right flex justify-end gap-2"><button onClick={() => openEditOffice(o)}>✏️</button><button onClick={() => deleteOffice(o.id)}>🗑️</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {officeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">{editingOffice ? 'Editar' : 'Nuevo'} Almacén</h3><button onClick={() => setOfficeModal(false)}>✕</button></div>
            <div className="space-y-4">
              <input type="text" placeholder="Nombre" value={officeForm.name} onChange={e => setOfficeForm(f => ({ ...f, name: e.target.value }))} className="form-input w-full" />
              <input type="text" placeholder="Dirección" value={officeForm.address} onChange={e => setOfficeForm(f => ({ ...f, address: e.target.value }))} className="form-input w-full" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Latitud" value={officeForm.latitude} onChange={e => setOfficeForm(f => ({ ...f, latitude: e.target.value }))} className="form-input w-full" />
                <input type="number" placeholder="Longitud" value={officeForm.longitude} onChange={e => setOfficeForm(f => ({ ...f, longitude: e.target.value }))} className="form-input w-full" />
              </div>
              <input type="number" placeholder="Radio cobertura (mi)" value={officeForm.coverageRadiusMiles} onChange={e => setOfficeForm(f => ({ ...f, coverageRadiusMiles: e.target.value }))} className="form-input w-full" />
            </div>
            <div className="mt-6 flex justify-end gap-3"><button onClick={() => setOfficeModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-500">Cancelar</button><button onClick={saveOffice} disabled={savingOffice} className="px-4 py-2 text-sm font-bold bg-[var(--color-primary)] text-white rounded-lg">{savingOffice ? '...' : 'Guardar'}</button></div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}