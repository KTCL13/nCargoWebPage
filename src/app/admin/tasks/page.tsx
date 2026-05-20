'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/context/AuthContext'
import { EmployeeSearch } from '@/components/ui/EmployeeSearch'
import { TaskTable } from '@/components/admin/tasks/TaskTable'
import { useTasks } from '@/lib/admin/tasks/useTasks'
import { useTaskActions } from '@/lib/admin/tasks/useTaskActions'
import { STATUS_LABELS, TaskStatus } from '@/types/admin/tasks'
import { Calendar, Clock, AlertCircle } from 'lucide-react'

export default function GestionTareasPage() {
  const { token } = useAuth()
  const {
    tasks, employees, total, page, setPage, pageSize, setPageSize, loading,
    statusFilter, setStatusFilter, employeeFilter, setEmployeeFilter,
    fetchData, handleDeleteTask, handleCheckOverdue
  } = useTasks(token)

  const {
    showCreateModal, setShowCreateModal, isBulk, setIsBulk, form, setForm, createLoading,
    reassignTask, setReassignTask, newEmployeeId, setNewEmployeeId, reassignLoading,
    toasts, handleCreateSubmit, handleReassign,
    isDateInvalid, dateError
  } = useTaskActions(token, employees, fetchData)

  return (
    <>
    <DashboardLayout
      pageTitle="Gestión de Tareas"
      navItems={NAV_ITEMS}
      onReload={fetchData}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-titles text-2xl font-extrabold text-[var(--color-foreground)]">Control de Tareas</h1>
            <p className="text-gray-500 text-sm">Asignación y seguimiento global de actividades</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCheckOverdue} className="bg-red-50 text-red-600 text-sm font-subtitles font-bold border border-red-100 px-4 py-2 rounded-[var(--radius-lg)] hover:bg-red-100 transition">⏰ Limpiar Vencidas</button>
            <button onClick={() => setShowCreateModal(true)} className="bg-[var(--color-primary)] text-white text-sm font-subtitles font-bold px-4 py-2 rounded-[var(--radius-lg)] hover:opacity-90 transition">+ Nueva Tarea</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Tareas" value={total} color="bg-white border-gray-100" />
          <StatCard label="Pendientes" value={tasks.filter(t => t.status === 'PENDING').length} color="bg-yellow-50 border-yellow-100 text-yellow-700" />
          <StatCard label="En Proceso" value={tasks.filter(t => t.status === 'IN_PROGRESS').length} color="bg-blue-50 border-blue-100 text-blue-700" />
          <StatCard label="No Hechas" value={tasks.filter(t => t.status === 'NOT_DONE').length} color="bg-red-50 border-red-100 text-red-700" />
        </div>

        <div className="bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as TaskStatus | ''); setPage(0) }} className="form-input w-full bg-white">
                <option value="">Todos los estados</option>
                {Object.entries(STATUS_LABELS).map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[300px]">
              <EmployeeSearch onSelect={emp => { setEmployeeFilter(emp ? String(emp.id) : ''); setPage(0) }} placeholder="Filtrar por empleado (Nombre o ID)..." className="bg-white" />
            </div>
          </div>

          <TaskTable tasks={tasks} loading={loading} onReassign={setReassignTask} onDelete={handleDeleteTask} />

          <div className="px-5 py-4 border-t border-gray-100">
            <Pagination page={page} pageSize={pageSize} totalItems={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-titles text-xl font-extrabold text-[var(--color-foreground)]">Nueva Tarea</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="flex p-1 bg-gray-100 rounded-[var(--radius-lg)]">
                <button type="button" onClick={() => setIsBulk(false)} className={`flex-1 py-1.5 text-xs font-bold rounded-[var(--radius-md)] transition ${!isBulk ? 'bg-white shadow text-[var(--color-primary)]' : 'text-gray-500'}`}>Individual</button>
                <button type="button" onClick={() => setIsBulk(true)} className={`flex-1 py-1.5 text-xs font-bold rounded-[var(--radius-md)] transition ${isBulk ? 'bg-white shadow text-[var(--color-primary)]' : 'text-gray-500'}`}>Asignación Masiva</button>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="form-input w-full" placeholder="Ej: Revisión de inventario" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="form-input w-full h-20 resize-none" placeholder="Instrucciones detalladas..." />
              </div>
              {isBulk ? <EmployeeSearch multi label="Empleados Responsables" onMultiSelect={emps => setForm(f => ({ ...f, employeeIds: emps.map(e => String(e.id)) }))} placeholder="Escribe para buscar y añadir empleados..." /> : <EmployeeSearch label="Empleado Responsable" onSelect={emp => setForm(f => ({ ...f, employeeId: emp ? String(emp.id) : '' }))} placeholder="Escribe nombre o identificación..." />}
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
                      <Calendar size={14} className="text-[var(--color-primary)]" /> Inicio
                    </label>
                    <div className="relative">
                      <input 
                        type="datetime-local" 
                        value={form.startTime} 
                        onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} 
                        className={`form-input w-full transition-colors ${isDateInvalid ? 'border-red-500 focus:border-red-600 focus:ring-red-100' : ''}`} 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
                      <Clock size={14} className="text-[var(--color-primary)]" /> Deadline
                    </label>
                    <div className="relative">
                      <input 
                        type="datetime-local" 
                        value={form.endTime} 
                        onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} 
                        className={`form-input w-full transition-colors ${isDateInvalid ? 'border-red-500 focus:border-red-600 focus:ring-red-100' : ''}`} 
                      />
                    </div>
                  </div>
                </div>
                
                {isDateInvalid && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2.5 rounded-[var(--radius-md)] border border-red-100 animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-[11px] font-bold leading-tight">La fecha de fin no puede ser anterior a la de inicio.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-[var(--radius-lg)] border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={createLoading || isDateInvalid} 
                  className={`flex-1 py-2.5 rounded-[var(--radius-lg)] text-white text-sm font-bold transition flex items-center justify-center gap-2 ${
                    isDateInvalid 
                    ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                    : 'bg-[var(--color-primary)] hover:opacity-90 active:scale-[0.98]'
                  }`}
                >
                  {createLoading ? 'Creando...' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reassignTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-titles text-lg font-bold text-[var(--color-foreground)] mb-4">Reasignar Tarea</h2>
            <p className="text-xs text-gray-500 mb-4 font-subtitles">Vas a reasignar: <span className="font-bold text-gray-900">{reassignTask.title}</span></p>
            <div className="space-y-4">
              <EmployeeSearch label="Nuevo Responsable" onSelect={emp => setNewEmployeeId(emp ? String(emp.id) : '')} placeholder="Buscar nuevo responsable..." />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setReassignTask(null)} className="flex-1 py-2.5 rounded-[var(--radius-lg)] border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
                <button onClick={handleReassign} disabled={reassignLoading || !newEmployeeId} className="flex-1 py-2.5 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50">{reassignLoading ? 'Procesando...' : 'Confirmar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>

    <div role="status" className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => <div key={t.id} aria-live="polite" aria-atomic="true" className="pointer-events-auto flex items-center gap-3 bg-[var(--color-foreground)] text-white pl-4 pr-5 py-3.5 rounded-[var(--radius-lg)] shadow-lg text-sm font-medium animate-in slide-in-from-right-full">✅ <span>{t.text}</span></div>)}
    </div>
    </>
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
