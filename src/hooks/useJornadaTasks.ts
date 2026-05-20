import { useState, useCallback, useEffect } from 'react'
import { TaskItem } from '@/lib/employee/jornada/types'
import { jornadaClient } from '@/lib/api-client/jornada'

export function useJornadaTasks(token: string | null, employeeId: number | null) {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [taskLoading, setTaskLoading] = useState(false)

  const loadTasks = useCallback(async () => {
    if (!token || !employeeId) return
    try {
      const combined = await jornadaClient.loadTasks(token, employeeId)
      setTasks(combined)
    } catch { /* silent */ }
  }, [token, employeeId])

  const handleCompleteTask = async () => {
    if (!selectedTaskId || !token) return
    setTaskLoading(true)
    try {
      await jornadaClient.completeTask(token, selectedTaskId)
      setSelectedTaskId(null)
      await loadTasks()
    } catch {
      // silent
    } finally {
      setTaskLoading(false)
    }
  }

  useEffect(() => {
    if (token && employeeId) loadTasks()
  }, [token, employeeId, loadTasks])

  return { tasks, selectedTaskId, setSelectedTaskId, taskLoading, loadTasks, handleCompleteTask }
}
