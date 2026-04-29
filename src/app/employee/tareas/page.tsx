'use client'

import { useCallback, useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useAuth } from '@/context/AuthContext'

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NOT_DONE'

interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  employeeId: number
  createdBy: number
  startTime: string | null
  endTime: string | null
  createdAt: string
}

const COLUMNS: { status: TaskStatus; label: string; dot: string }[] = [
  { status: 'PENDING', label: 'Por Hacer', dot: '#9CA3AF' },
  { status: 'IN_PROGRESS', label: 'En Proceso', dot: '#FF003B' },
  { status: 'COMPLETED', label: 'Finalizado', dot: '#22C55E' },
]

export default function TareasPage() {
  const { user, token } = useAuth()
  const employeeId = user?.id ?? null

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const authHeaders = useCallback(
    (extra?: Record<string, string>) => ({
      ...(extra ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  )

  const loadTasks = useCallback(async () => {
    if (!employeeId) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/tasks?employeeId=${employeeId}&limit=100&_=${Date.now()}`,
        {
          headers: authHeaders(),
          cache: 'no-store',
        },
      )
      if (!res.ok) {
        console.error('[tareas] GET /api/tasks failed:', res.status, await res.text())
        setTasks([])
        return
      }
      const d = await res.json()
      setTasks(Array.isArray(d?.data) ? d.data : [])
    } catch (err) {
      console.error('[tareas] GET /api/tasks error:', err)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [employeeId, authHeaders])

  useEffect(() => {
    if (employeeId) loadTasks()
  }, [employeeId, loadTasks])

  async function createTask() {
    if (!newTitle.trim() || !employeeId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tasks?adminId=${employeeId}`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        cache: 'no-store',
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim() || null,
          employeeId,
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        console.error('[tareas] POST /api/tasks failed:', res.status, msg)
        alert('No se pudo crear la tarea')
        return
      }
      setNewTitle('')
      setNewDesc('')
      setModalOpen(false)
      await loadTasks()
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(id: number, status: TaskStatus) {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, status } : t)))

    try {
      const res = await fetch(`/api/tasks?id=${id}`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        cache: 'no-store',
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const msg = await res.text()
        console.error('[tareas] PUT /api/tasks failed:', res.status, msg)
        alert('No se pudo actualizar el estado')
      }
    } catch (err) {
      console.error('[tareas] PUT /api/tasks error:', err)
    } finally {
      await loadTasks()
    }
  }

  return (
    <DashboardLayout
      pageTitle="Mis tareas"
      navItems={NAV_ITEMS}
      onReload={() => loadTasks()}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-titles text-2xl font-extrabold text-[var(--color-nc-dark)]">Mis tareas</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-sm px-5 py-2 rounded-lg"
        >
          + Nueva Tarea
        </button>
      </div>

      {!employeeId ? (
        <div className="text-center py-16 text-[var(--color-nc-dark)]/40 font-subtitles">Verificando sesión…</div>
      ) : loading ? (
        <div className="text-center py-16 text-[var(--color-nc-dark)]/40 font-subtitles">Cargando tareas…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.status)
            return (
              <div key={col.status} className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 flex flex-col gap-3">
                {/* Column header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.dot }} />
                    <span className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)]">{col.label}</span>
                  </div>
                  <span className="font-subtitles text-xs font-bold text-white bg-[var(--color-nc-dark)] rounded-full w-6 h-6 flex items-center justify-center">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task cards */}
                {colTasks.length === 0 && (
                  <p className="text-center text-xs text-[var(--color-nc-dark)]/30 font-subtitles py-6">Sin tareas</p>
                )}
                {colTasks.map(task => (
                  <div key={task.id} className="bg-[#F7F8FA] rounded-xl p-3 flex flex-col gap-2 border border-black/5">
                    <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)] leading-tight">{task.title}</p>
                    {task.description && (
                      <p className="font-body text-xs text-[var(--color-nc-dark)]/50 leading-relaxed">{task.description}</p>
                    )}

                    {(task.startTime || task.endTime) && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-subtitles text-[var(--color-nc-dark)]/50 mt-0.5">
                        {col.status === 'COMPLETED' && task.endTime && (
                          <span>✓ {new Date(task.endTime).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        {col.status !== 'COMPLETED' && task.endTime && (
                          <span>📅 {new Date(task.endTime).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        {col.status === 'IN_PROGRESS' && task.startTime && (
                          <span>▶ {new Date(task.startTime).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <div className="flex gap-1 flex-wrap">
                        {col.status === 'PENDING' && (
                          <button
                            onClick={() => updateStatus(task.id, 'IN_PROGRESS')}
                            className="text-xs px-3 py-1 rounded-full bg-[var(--color-nc-red)] text-white font-subtitles font-semibold hover:brightness-110 transition-all"
                          >
                            ▶ Iniciar
                          </button>
                        )}
                        {col.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateStatus(task.id, 'COMPLETED')}
                            className="text-xs px-3 py-1 rounded-full bg-green-500 text-white font-subtitles font-semibold hover:brightness-110 transition-all"
                          >
                            ✓ Completar
                          </button>
                        )}
                        {col.status !== 'COMPLETED' && (
                          <button
                            onClick={() => updateStatus(task.id, 'CANCELLED')}
                            className="text-xs px-3 py-1 rounded-full border border-black/15 text-[var(--color-nc-dark)]/50 font-subtitles hover:bg-black/5 transition-all"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* New Task Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] mx-4 p-6 flex flex-col gap-4">
            <div>
              <p className="font-titles text-lg font-bold text-[var(--color-nc-dark)]">Nueva Tarea</p>
              <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50 mt-0.5">Agrega una tarea al tablero</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/70 uppercase tracking-wide">
                Nombre de la tarea
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Ej: Revisión de contratos"
                className="border border-black/15 rounded-lg px-3 py-2 text-sm font-body text-[var(--color-nc-dark)] outline-none focus:border-[var(--color-nc-blue)] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/70 uppercase tracking-wide">
                Descripción
              </label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Describe brevemente la tarea…"
                className="border border-black/15 rounded-lg px-3 py-2 text-sm font-body text-[var(--color-nc-dark)] outline-none focus:border-[var(--color-nc-blue)] transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="btn-outline text-sm px-5 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={createTask}
                disabled={!newTitle.trim() || saving}
                className="btn-primary text-sm px-5 py-2 rounded-lg disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Agregar Tarea'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
