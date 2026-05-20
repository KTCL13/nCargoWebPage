'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useTasks } from '@/lib/employee/tareas/useTasks'
import { KanbanBoard } from '@/components/employee/tareas/KanbanBoard'
import { NewTaskModal } from '@/components/employee/tareas/NewTaskModal'

export default function TareasPage() {
  const {
    employeeId, tasks, loading, actionError, setActionError,
    modalOpen, setModalOpen, newTitle, setNewTitle, newDesc, setNewDesc,
    saving, canUpdate, loadTasks, loadAttendance,
    createTask, updateStatus
  } = useTasks()

  return (
    <DashboardLayout pageTitle="Mis tareas" navItems={NAV_ITEMS} onReload={() => { loadTasks(); loadAttendance() }}>
      <div className="flex items-center justify-between">
        <h2 className="font-titles text-2xl font-extrabold text-[var(--color-nc-dark)]">Mis tareas</h2>
        <button onClick={() => setModalOpen(true)} className="btn-primary text-sm px-5 py-2 rounded-lg">
          + Nueva Tarea
        </button>
      </div>

      {!canUpdate && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="text-amber-500 text-lg flex-shrink-0 mt-0.5">⚠</span>
          <div>
            <p className="font-subtitles text-sm font-semibold text-amber-800">Jornada no iniciada</p>
            <p className="font-subtitles text-xs text-amber-700 mt-0.5">
              Para iniciar, completar o cancelar tareas debes tener una jornada laboral activa.
              Dirígete a <strong>Jornada</strong> para comenzar tu sesión.
            </p>
          </div>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-red-500 text-sm">✕</span>
          <p className="font-subtitles text-sm text-red-700">{actionError}</p>
          <button onClick={() => setActionError(null)} className="ml-auto text-red-400 hover:text-red-600 text-xs">Cerrar</button>
        </div>
      )}

      {!employeeId ? (
        <div className="text-center py-16 text-[var(--color-nc-dark)]/40 font-subtitles">Verificando sesión…</div>
      ) : loading ? (
        <div className="text-center py-16 text-[var(--color-nc-dark)]/40 font-subtitles">Cargando tareas…</div>
      ) : (
        <KanbanBoard
          tasks={tasks}
          canUpdate={canUpdate}
          onUpdateStatus={updateStatus}
        />
      )}

      <NewTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={newTitle}
        setTitle={setNewTitle}
        description={newDesc}
        setDescription={setNewDesc}
        onSave={createTask}
        saving={saving}
      />
    </DashboardLayout>
  )
}
