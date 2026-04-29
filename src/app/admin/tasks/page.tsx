'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/context/AuthContext'

// ── Types from OpenAPI spec (simplified) ──────────────────────────────
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NOT_DONE'

interface Employee {
  id: number
  name: string
  email: string
}

interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  employeeId: number
  employee?: Employee // Populated by frontend or backend join
  createdBy: number
  assignedBy: number | null
  startTime: string | null
  endTime: string | null
  createdAt: string
}

const LIMIT = 10

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Proceso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  NOT_DONE: 'No Hecho',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
  NOT_DONE: 'bg-red-100 text-red-700 border-red-200',
}

export default function GestionTareasPage() {
  const { user } = useAuth()

  // ── State ────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [employeeFilter, setEmployeeFilter] = useState<string>('')

  // Creation Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isBulk, setIsBulk] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    employeeId: '',
    employeeIds: [] as string[],
    startTime: '',
    endTime: '',
  })
  const [createLoading, setCreateLoading] = useState(false)

  // Reassign Modal
  const [reassignTask, setReassignTask] = useState<Task | null>(null)
  const [newEmployeeId, setNewEmployeeId] = useState('')
  const [reassignLoading, setReassignLoading] = useState(false)

  // ── Data Fetching ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const taskParams = new URLSearchParams({
        page: String(page + 1),
        limit: String(LIMIT),
        ...(statusFilter && { status: statusFilter }),
        ...(employeeFilter && { employeeId: employeeFilter }),
      })

      const [tasksRes, empsRes] = await Promise.all([
        fetch(`/api/tasks?${taskParams}`),
        fetch('/api/employees?limit=100'), // Get active employees for selectors
      ])

      const tasksData = await tasksRes.json()
      const empsData = await empsRes.json()

      const emps = Array.isArray(empsData) ? empsData : (empsData.data ?? [])
      setEmployees(emps)

      // Map employee names to tasks for the table
      const tasksWithEmps = (tasksData.data ?? []).map((t: Task) => ({
        ...t,
        employee: emps.find((e: Employee) => e.id === t.employeeId)
      }))

      setTasks(tasksWithEmps)
      setTotal(tasksData.total ?? 0)
    } catch (err) {
      console.error('Error fetching tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, employeeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Actions ──────────────────────────────────────────────────────────
  const handleCheckOverdue = async () => {
    if (!confirm('¿Deseas marcar todas las tareas pendientes vencidas como "No Hechas"?')) return
    try {
      const res = await fetch('/api/tasks/check-overdue', { method: 'POST' })
      if (res.ok) {
        alert('Tareas procesadas correctamente')
        fetchData()
      }
    } catch (err) {
      alert('Error al verificar tareas vencidas')
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    try {
      const url = isBulk ? '/api/tasks/bulk-assign' : `/api/tasks?adminId=${user?.id ?? ''}`
      const payload = isBulk
        ? {
          title: form.title,
          description: form.description,
          employeeIds: form.employeeIds.map(Number),
          startTime: form.startTime || undefined,
          endTime: form.endTime || undefined,
        }
        : {
          title: form.title,
          description: form.description,
          employeeId: Number(form.employeeId),
          startTime: form.startTime || undefined,
          endTime: form.endTime || undefined,
        }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setShowCreateModal(false)
        setForm({ title: '', description: '', employeeId: '', employeeIds: [], startTime: '', endTime: '' })
        fetchData()
      } else {
        const err = await res.json()
        alert(err.message || 'Error al crear tarea')
      }
    } finally {
      setCreateLoading(false)
    }
  }

  const handleReassign = async () => {
    if (!reassignTask || !newEmployeeId) return
    setReassignLoading(true)
    try {
      const res = await fetch(`/api/tasks/reassign?id=${reassignTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmployeeId: Number(newEmployeeId) })
      })
      if (res.ok) {
        setReassignTask(null)
        setNewEmployeeId('')
        fetchData()
      }
    } finally {
      setReassignLoading(false)
    }
  }

  const handleDeleteTask = async (id: number) => {
    if (!confirm('¿Deseas eliminar esta tarea permanentemente?')) return
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch (err) {
      alert('Error al eliminar tarea')
    }
  }

  // ── Stats ────────────────────────────────────────────────────────────
  // (In a real app, these would come from an analytics endpoint)
  const taskSummary = useMemo(() => {
    return {
      total: total,
      pending: tasks.filter(t => t.status === 'PENDING').length, // This is only per-page, bad for stats but okay for demo if full stats not avail
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    }
  }, [total, tasks])

  const pageCount = Math.ceil(total / LIMIT)

  return (
    <DashboardLayout
      pageTitle="Gestión de Tareas"
      navItems={NAV_ITEMS}
      onReload={fetchData}
    >
      <div className="space-y-6">

        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-titles text-2xl font-extrabold text-[var(--color-foreground)]">Control de Tareas</h1>
            <p className="text-gray-500 text-sm">Asignación y seguimiento global de actividades</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCheckOverdue}
              className="bg-red-50 text-red-600 text-sm font-subtitles font-bold border border-red-100 px-4 py-2 rounded-[var(--radius-lg)] hover:bg-red-100 transition"
            >
              ⏰ Limpiar Vencidas
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[var(--color-primary)] text-white text-sm font-subtitles font-bold px-4 py-2 rounded-[var(--radius-lg)] hover:opacity-90 transition"
            >
              + Nueva Tarea
            </button>
          </div>
        </div>

        {/* Global Monitor Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Tareas" value={total} color="bg-white border-gray-100" />
          <StatCard label="Pendientes" value={tasks.filter(t => t.status === 'PENDING').length} color="bg-yellow-50 border-yellow-100 text-yellow-700" />
          <StatCard label="En Proceso" value={tasks.filter(t => t.status === 'IN_PROGRESS').length} color="bg-blue-50 border-blue-100 text-blue-700" />
          <StatCard label="No Hechas" value={tasks.filter(t => t.status === 'NOT_DONE').length} color="bg-red-50 border-red-100 text-red-700" />
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-gray-100 overflow-hidden">

          {/* Filters Area */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value as TaskStatus | ''); setPage(0) }}
                className="form-input w-full bg-white"
              >
                <option value="">Todos los estados</option>
                {Object.entries(STATUS_LABELS).map(([val, lab]) => (
                  <option key={val} value={val}>{lab}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <select
                value={employeeFilter}
                onChange={e => { setEmployeeFilter(e.target.value); setPage(0) }}
                className="form-input w-full bg-white"
              >
                <option value="">Todos los empleados</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">ID</th>
                  <th className="px-5 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Tarea</th>
                  <th className="px-5 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Asignado a</th>
                  <th className="px-5 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Estado</th>
                  <th className="px-5 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Vencimiento</th>
                  <th className="px-5 py-3 text-right font-subtitles text-xs uppercase tracking-wide text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400 font-subtitles">Cargando tareas...</td></tr>
                ) : tasks.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400 font-subtitles">No hay tareas que coincidan con los filtros</td></tr>
                ) : tasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gray-400">#{task.id}</td>
                    <td className="px-5 py-4 min-w-[200px]">
                      <p className="font-subtitles font-bold text-[var(--color-foreground)]">{task.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{task.description || 'Sin descripción'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                          {task.employee?.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-subtitles text-gray-700">{task.employee?.name || 'Cargando...'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-xs font-subtitles text-gray-600">
                        {task.endTime ? new Date(task.endTime).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin límite'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setReassignTask(task)}
                          className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Reasignar"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-subtitles">
              Mostrando {tasks.length} de {total} tareas
            </p>
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* ── Create Task Modal (Individual & Bulk) ────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-titles text-xl font-extrabold text-[var(--color-foreground)]">Nueva Tarea</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* Type Switch */}
              <div className="flex p-1 bg-gray-100 rounded-[var(--radius-lg)]">
                <button
                  type="button"
                  onClick={() => setIsBulk(false)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-[var(--radius-md)] transition ${!isBulk ? 'bg-white shadow text-[var(--color-primary)]' : 'text-gray-500'}`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulk(true)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-[var(--radius-md)] transition ${isBulk ? 'bg-white shadow text-[var(--color-primary)]' : 'text-gray-500'}`}
                >
                  Asignación Masiva
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="form-input w-full"
                  placeholder="Ej: Revisión de inventario"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="form-input w-full h-20 resize-none"
                  placeholder="Instrucciones detalladas..."
                />
              </div>

              {/* Employee Selector(s) */}
              {isBulk ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Empleados (Ctrl + clic para varios)</label>
                  <select
                    multiple
                    required
                    value={form.employeeIds}
                    onChange={e => {
                      const options = Array.from(e.target.selectedOptions).map(o => o.value)
                      setForm(f => ({ ...f, employeeIds: options }))
                    }}
                    className="form-input w-full h-32"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Empleado Responsable</label>
                  <select
                    required
                    value={form.employeeId}
                    onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                    className="form-input w-full"
                  >
                    <option value="">Seleccionar...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio</label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deadline</label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-[var(--radius-lg)] border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2.5 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                  {createLoading ? 'Creando...' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reassign Modal ────────────────────────────────────────── */}
      {reassignTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-2xl w-full max-w-sm overflow-hidden p-6">
            <h2 className="font-titles text-lg font-bold text-[var(--color-foreground)] mb-4">Reasignar Tarea</h2>
            <p className="text-xs text-gray-500 mb-4 font-subtitles">
              Vas a reasignar: <span className="font-bold text-gray-900">{reassignTask.title}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nuevo Responsable</label>
                <select
                  required
                  value={newEmployeeId}
                  onChange={e => setNewEmployeeId(e.target.value)}
                  className="form-input w-full"
                >
                  <option value="">Seleccionar empleado...</option>
                  {employees.filter(e => e.id !== reassignTask.employeeId).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignTask(null)}
                  className="flex-1 py-2.5 rounded-[var(--radius-lg)] border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReassign}
                  disabled={reassignLoading || !newEmployeeId}
                  className="flex-1 py-2.5 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                  {reassignLoading ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`p-4 rounded-[var(--radius-xl)] border shadow-sm ${color}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-extrabold font-titles leading-none">{value}</p>
    </div>
  )
}
