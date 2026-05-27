import { useState } from 'react'
import { Task, TaskEmployee } from '@/types/admin/tasks'
import { authFetch } from '@/lib/api-client/auth-fetch'
// State to hold date validation error message


type ToastMsg = { id: number; text: string }

export function useTaskActions(token: string | null, employees: TaskEmployee[], fetchData: () => void) {
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

  const [reassignTask, setReassignTask] = useState<Task | null>(null)
  const [newEmployeeId, setNewEmployeeId] = useState('')
  const [reassignLoading, setReassignLoading] = useState(false)

  const [toasts, setToasts] = useState<ToastMsg[]>([])

  const showToast = (text: string) => {
    const id = Date.now()
    setToasts(ts => [...ts, { id, text }])
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 5000)
  }

  // Reactive validation for dates
  const minStart = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; })();
  const maxEnd = (() => {
    if (!form.startTime) return null;
    const d = new Date(form.startTime);
    d.setFullYear(d.getFullYear() + 1);
    return d;
  })();

  const startTooEarly = !!(form.startTime && new Date(form.startTime) < minStart);
  const endBeforeStart = !!(form.startTime && form.endTime && new Date(form.endTime) < new Date(form.startTime));
  const rangeExceedsYear = !!(form.startTime && form.endTime && maxEnd && new Date(form.endTime) > maxEnd);

  const isDateInvalid = startTooEarly || endBeforeStart || rangeExceedsYear;

  const dateError =
    startTooEarly
      ? 'La fecha de inicio no puede ser anterior a un mes desde hoy.'
      : endBeforeStart
      ? 'La fecha de fin no puede ser anterior a la de inicio.'
      : rangeExceedsYear
      ? 'El rango entre inicio y fin no puede superar un año.'
      : '';

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (isDateInvalid) {
      return;
    }
    setCreateLoading(true);
    try {
      const apiUrl = isBulk ? '/api/tasks/bulk-assign' : '/api/tasks'
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

      const res = await authFetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setShowCreateModal(false)
        setForm({ title: '', description: '', employeeId: '', employeeIds: [], startTime: '', endTime: '' })
        fetchData()
        if (isBulk) {
          showToast(`Tareas asignadas a ${form.employeeIds.length} empleados`)
        } else {
          const emp = employees.find(e => e.id === Number(form.employeeId))
          const name = emp ? `${emp.firstName} ${emp.lastName}` : 'empleado'
          showToast(`Asignaste la tarea "${form.title}" a ${name}`)
        }
      } else {
        const err = await res.json()
        alert(err.message || 'Error al crear tarea')
      }
    } finally {
      setCreateLoading(false)
    }
  }

  const handleReassign = async () => {
    if (!reassignTask || !newEmployeeId || !token) return
    setReassignLoading(true)
    try {
      const res = await authFetch(`/api/tasks/reassign?id=${reassignTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newEmployeeId: Number(newEmployeeId) }),
      })
      if (res.ok) {
        const emp = employees.find(e => e.id === Number(newEmployeeId))
        const name = emp ? `${emp.firstName} ${emp.lastName}` : 'empleado'
        showToast(`Reasignaste "${reassignTask.title}" a ${name}`)
        setReassignTask(null)
        setNewEmployeeId('')
        fetchData()
      }
    } finally {
      setReassignLoading(false)
    }
  }

  return {
    showCreateModal, setShowCreateModal, isBulk, setIsBulk, form, setForm, createLoading,
    reassignTask, setReassignTask, newEmployeeId, setNewEmployeeId, reassignLoading,
    toasts, handleCreateSubmit, handleReassign,
    dateError, isDateInvalid
  }
}
