'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'

type Job = {
  id: number
  title: string
  description?: string
}

export default function CargosPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingJobId, setEditingJobId] = useState<number | null>(null)
  
  const [form, setForm] = useState({ title: '', description: '' })
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/jobs')
      const data = await res.json()
      setJobs(Array.isArray(data) ? data : (data.data ?? []))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const openCreate = () => {
    setModalMode('create')
    setEditingJobId(null)
    setForm({ title: '', description: '' })
    setModalError('')
    setShowModal(true)
  }

  const openEdit = (job: Job) => {
    setModalMode('edit')
    setEditingJobId(job.id)
    setForm({ title: job.title, description: job.description || '' })
    setModalError('')
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este cargo?')) return
    try {
      const res = await fetch(`/api/jobs?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      fetchJobs()
    } catch (err) {
      alert('No se pudo eliminar el cargo. Es posible que esté en uso por algún contrato.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalLoading(true)
    setModalError('')
    try {
      const url = modalMode === 'edit' ? `/api/jobs?id=${editingJobId}` : '/api/jobs'
      const method = modalMode === 'edit' ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error al guardar')
      }
      setShowModal(false)
      fetchJobs()
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <DashboardLayout
      pageTitle="Gestión de Cargos"
      navItems={NAV_ITEMS}
      onReload={fetchJobs}
    >
      <div className="bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-gray-100 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h3 className="font-titles text-lg font-bold text-[var(--color-foreground)]">
            Cargos de la Empresa
          </h3>
          <button
            onClick={openCreate}
            className="bg-[var(--color-primary)] text-white text-sm font-subtitles font-semibold px-4 py-2 rounded-[var(--radius-lg)] hover:opacity-90 transition whitespace-nowrap"
          >
            + Añadir Cargo
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">ID</th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Título</th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Descripción</th>
                <th className="px-4 py-3 text-right font-subtitles text-xs uppercase tracking-wide text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400 font-subtitles text-sm">Cargando...</td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400 font-subtitles text-sm">No se encontraron cargos</td>
                </tr>
              ) : jobs.map(job => (
                <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="px-4 py-3 font-mono text-gray-400 text-xs">{job.id}</td>
                  <td className="px-4 py-3 font-subtitles font-semibold text-[var(--color-foreground)]">{job.title}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-sm truncate">
                    {job.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(job)}
                      className="text-[var(--color-primary)] hover:underline font-semibold text-xs mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="text-red-600 hover:underline font-semibold text-xs"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="font-titles text-xl font-extrabold text-[var(--color-foreground)]">
                {modalMode === 'create' ? 'Añadir Cargo' : 'Editar Cargo'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Título</label>
                <input
                  type="text" required placeholder="Ej: Operador logístico"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Descripción (opcional)</label>
                <textarea
                  placeholder="Detalles sobre el cargo..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="form-input w-full resize-none h-24"
                />
              </div>

              {modalError && (
                <p className="text-xs text-[var(--color-primary)] px-3 py-2 bg-red-50 rounded-[var(--radius-lg)] border border-red-100">
                  {modalError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-[var(--radius-lg)] border border-gray-200 text-sm font-subtitles font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-white text-sm font-subtitles font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {modalLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
