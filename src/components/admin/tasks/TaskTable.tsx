import { Task, STATUS_COLORS, STATUS_LABELS } from '@/types/admin/tasks'

interface TaskTableProps {
  tasks: Task[]
  loading: boolean
  onReassign: (task: Task) => void
  onDelete: (id: number) => void
}

export function TaskTable({ tasks, loading, onReassign, onDelete }: TaskTableProps) {
  return (
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
                    {task.employee ? (task.employee.firstName[0] + task.employee.lastName[0]).toUpperCase() : '?'}
                  </div>
                  <span className="font-subtitles text-gray-700">{task.employee ? `${task.employee.firstName} ${task.employee.lastName}` : 'Cargando...'}</span>
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
                    onClick={() => onReassign(task)}
                    className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Reasignar"
                  >
                    🔄
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
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
  )
}
