import { Task, STATUS_COLORS, STATUS_LABELS } from '@/types/admin/tasks'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useTableSort, SortDirection } from '@/hooks/useTableSort'

interface TaskTableProps {
  tasks: Task[]
  loading: boolean
  onReassign: (task: Task) => void
  onDelete: (id: number) => void
}

type SortColumn = 'title' | 'employee' | 'status' | 'endTime' | null;

export function TaskTable({ tasks, loading, onReassign, onDelete }: TaskTableProps) {
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

  const { sortColumn, sortDirection, handleSort, sortedItems: sortedTasks } = useTableSort<Task, NonNullable<SortColumn>>(
    tasks,
    { column: null, direction: 'asc' },
    (item, column) => {
      switch (column) {
        case 'title': return item.title.toLowerCase();
        case 'employee': return item.employee ? `${item.employee.firstName} ${item.employee.lastName}`.toLowerCase() : '';
        case 'status': return STATUS_LABELS[item.status];
        case 'endTime': return item.endTime ? new Date(item.endTime).getTime() : Infinity;
        default: return '';
      }
    }
  );

  const handleConfirmDelete = () => {
    if (taskToDelete !== null) {
      onDelete(taskToDelete);
      setTaskToDelete(null);
    }
  };

  const renderSortIndicator = (column: NonNullable<SortColumn>) => {
    if (sortColumn !== column) return <span className="ml-1 opacity-20">↕</span>;
    return <span className="ml-1 text-[var(--color-primary)]">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table role="grid" aria-label="Data table" className="w-full text-sm">
          <thead role="rowgroup">
            <tr role="row" className="border-b border-gray-100 bg-gray-50/50">
              <th 
                role="columnheader" 
                className="px-5 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handleSort('title')}
              >
                Tarea {renderSortIndicator('title')}
              </th>
              <th 
                role="columnheader" 
                className="px-5 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handleSort('employee')}
              >
                Asignado a {renderSortIndicator('employee')}
              </th>
              <th 
                role="columnheader" 
                className="px-5 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handleSort('status')}
              >
                Estado {renderSortIndicator('status')}
              </th>
              <th 
                role="columnheader" 
                className="px-5 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handleSort('endTime')}
              >
                Vencimiento {renderSortIndicator('endTime')}
              </th>
              <th role="columnheader" className="px-5 py-3 text-right font-subtitles text-xs uppercase tracking-wide text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody role="rowgroup" className="divide-y divide-gray-50">
            {loading ? (
              <tr role="row"><td role="gridcell" colSpan={5} className="text-center py-12 text-gray-600 font-subtitles">Cargando tareas...</td></tr>
            ) : sortedTasks.length === 0 ? (
              <tr role="row"><td role="gridcell" colSpan={5} className="text-center py-12 text-gray-600 font-subtitles">No hay tareas que coincidan con los filtros</td></tr>
            ) : sortedTasks.map(task => (
              <tr role="row" key={task.id} className="hover:bg-gray-50 transition-colors">
                <td role="gridcell" className="px-5 py-4 min-w-[200px]">
                  <p className="font-subtitles font-bold text-[var(--color-foreground)]">{task.title}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{task.description || 'Sin descripción'}</p>
                </td>
                <td role="gridcell" className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                      {task.employee ? (task.employee.firstName[0] + task.employee.lastName[0]).toUpperCase() : '?'}
                    </div>
                    <span className="font-subtitles text-gray-700">{task.employee ? `${task.employee.firstName} ${task.employee.lastName}` : 'Cargando...'}</span>
                  </div>
                </td>
                <td role="gridcell" className="px-5 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </td>
                <td role="gridcell" className="px-5 py-4 whitespace-nowrap">
                  <p className="text-xs font-subtitles text-gray-600">
                    {task.endTime ? new Date(task.endTime).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin límite'}
                  </p>
                </td>
                <td role="gridcell" className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onReassign(task)}
                      className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Reasignar"
                    >
                      🔄
                    </button>
                    <button
                      onClick={() => setTaskToDelete(task.id)}
                      className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:text-red-600 hover:bg-red-50 transition"
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

      <ConfirmDialog
        isOpen={taskToDelete !== null}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar esta tarea?"
        description="Esta acción no se puede deshacer. La tarea será eliminada permanentemente del sistema."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  )
}
