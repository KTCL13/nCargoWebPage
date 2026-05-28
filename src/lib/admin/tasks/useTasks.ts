import { useState, useCallback, useEffect } from 'react'
import { Task, TaskStatus, TaskEmployee } from '@/types/admin/tasks'
import { authFetch } from '@/lib/api-client/auth-fetch'

const DEFAULT_LIMIT = 10

export function useTasks(token: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<TaskEmployee[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_LIMIT)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [employeeFilter, setEmployeeFilter] = useState<string>('')

  const fetchData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    const auth = { Authorization: `Bearer ${token}` }
    try {
      const taskParams = new URLSearchParams({
        page: String(page + 1),
        limit: String(pageSize),
        ...(statusFilter && { status: statusFilter }),
        ...(employeeFilter && { employeeId: employeeFilter }),
      })

      const [tasksRes, empsRes] = await Promise.all([
        authFetch(`/api/tasks?${taskParams}`, { headers: auth }),
        authFetch('/api/employees?limit=100', { headers: auth }),
      ])

      const tasksData = await tasksRes.json()
      const empsData = await empsRes.json()

      const emps = Array.isArray(empsData) ? empsData : (empsData.data ?? [])
      setEmployees(emps)

      const tasksWithEmps = (tasksData.data ?? []).map((t: Task) => ({
        ...t,
        employee: emps.find((e: TaskEmployee) => e.id === t.employeeId)
      }))

      setTasks(tasksWithEmps)
      setTotal(tasksData.total ?? 0)
    } catch (err) {
      console.error('Error fetching tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, employeeFilter, token])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDeleteTask = async (id: number, reason?: string) => {
    if (!token) return
    try {
      const res = await authFetch(`/api/tasks?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(reason ? { body: JSON.stringify({ reason }) } : {}),
      })
      if (res.ok) fetchData()
    } catch {
      alert('Error al eliminar tarea')
    }
  }

  const handleCheckOverdue = async () => {
    if (!confirm('¿Deseas marcar todas las tareas pendientes vencidas como "No Hechas"?')) return
    try {
      const res = await authFetch('/api/tasks/check-overdue', { method: 'POST' })
      if (res.ok) {
        alert('Tareas procesadas correctamente')
        fetchData()
      }
    } catch (err) {
      alert('Error al verificar tareas vencidas')
    }
  }

  return {
    tasks, employees, total, page, setPage, pageSize, setPageSize, loading,
    statusFilter, setStatusFilter, employeeFilter, setEmployeeFilter,
    fetchData, handleDeleteTask, handleCheckOverdue,
  }
}
