'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'
import { useJobs } from '@/lib/admin/jobs/useJobs'
import { Job } from '@/types/admin/jobs'
import { authFetch } from '@/lib/api-client/auth-fetch'

export default function CargosPage() {
  const { jobs, total, page, setPage, pageSize, setPageSize, loading, fetchJobs, deleteJob } = useJobs()
  const [showModal, setShowModal] = useState(false); const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingJobId, setEditingJobId] = useState<number | null>(null); const [form, setForm] = useState({ title: '', description: '' })
  const [modalLoading, setModalLoading] = useState(false); const [modalError, setModalError] = useState('')

  const openCreate = () => { setModalMode('create'); setEditingJobId(null); setForm({ title: '', description: '' }); setModalError(''); setShowModal(true) }
  const openEdit = (job: Job) => { setModalMode('edit'); setEditingJobId(job.id); setForm({ title: job.title, description: job.description || '' }); setModalError(''); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setModalLoading(true); setModalError('')
    try {
      const res = await authFetch(modalMode === 'edit' ? `/api/jobs?id=${editingJobId}` : '/api/jobs', { method: modalMode === 'edit' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).message || 'Error')
      setShowModal(false); fetchJobs()
    } catch (err) { setModalError(err instanceof Error ? err.message : 'Error') } finally { setModalLoading(false) }
  }

  return (
    <DashboardLayout pageTitle="Cargos" navItems={NAV_ITEMS} onReload={fetchJobs}>
      <div className="bg-white rounded-[var(--radius-xl)] shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-titles text-lg font-bold">Cargos de la Empresa</h3>
          <button onClick={openCreate} className="bg-[var(--color-primary)] text-white text-sm font-bold px-4 py-2 rounded-lg">+ Añadir</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50"><th className="px-4 py-3 text-left font-bold text-gray-400 text-xs">ID</th><th className="px-4 py-3 text-left font-bold text-gray-400 text-xs">Título</th><th className="px-4 py-3 text-left font-bold text-gray-400 text-xs">Descripción</th><th className="px-4 py-3 text-right font-bold text-gray-400 text-xs">Acciones</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">Cargando...</td></tr> : jobs.length === 0 ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">Sin cargos</td></tr> : jobs.map(job => (
                <tr key={job.id} className="border-b hover:bg-gray-50/50"><td className="px-4 py-3 font-mono text-gray-400 text-xs">{job.id}</td><td className="px-4 py-3 font-bold">{job.title}</td><td className="px-4 py-3 text-xs text-gray-500 truncate max-w-sm">{job.description || '—'}</td><td className="px-4 py-3 text-right"><button onClick={() => openEdit(job)} className="text-indigo-600 font-bold mr-3">Editar</button><button onClick={() => deleteJob(job.id)} className="text-red-600 font-bold">Eliminar</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t"><Pagination page={page} pageSize={pageSize} totalItems={total} onPageChange={setPage} onPageSizeChange={setPageSize} /></div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6"><h2 className="font-bold text-xl mb-4">{modalMode === 'create' ? 'Añadir' : 'Editar'} Cargo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Título</label><input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="form-input w-full" /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Descripción</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="form-input w-full h-24" /></div>
              {modalError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{modalError}</p>}
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 font-bold text-gray-500">Cancelar</button><button type="submit" disabled={modalLoading} className="flex-1 py-2 bg-[var(--color-primary)] text-white rounded-lg font-bold">{modalLoading ? '...' : 'Guardar'}</button></div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
