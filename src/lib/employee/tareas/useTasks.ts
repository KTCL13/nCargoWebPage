import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Task, TaskStatus, AttendanceStatus } from './types'

export function useTasks() {
  const { user, token } = useAuth()
  const employeeId = user?.id ?? null

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>(null)
  const canUpdate = attendanceStatus === 'OPEN' || attendanceStatus === 'PAUSED'

  const authHeaders = useCallback(
    (extra?: Record<string, string>): HeadersInit => {
      const h: Record<string, string> = { ...extra }
      if (token) h.Authorization = `Bearer ${token}`
      return h
    },
    [token],
  )

  const loadAttendance = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`/api/attendance/today?_=${Date.now()}`, {
        headers: authHeaders(),
        cache: 'no-store',
      })
      if (!res.ok) { setAttendanceStatus(null); return }
      const data = await res.json()
      setAttendanceStatus(data ? (data.status as AttendanceStatus) : null)
    } catch {
      setAttendanceStatus(null)
    }
  }, [token, authHeaders])

  const loadTasks = useCallback(async () => {
    if (!employeeId) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/tasks?employeeId=${employeeId}&limit=200&_=${Date.now()}`,
        { headers: authHeaders(), cache: 'no-store' },
      )
      if (!res.ok) { setTasks([]); return }
      const d = await res.json()
      setTasks(Array.isArray(d?.data) ? d.data : [])
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [employeeId, authHeaders])

  useEffect(() => {
    if (token) loadAttendance()
  }, [token, loadAttendance])

  useEffect(() => {
    if (employeeId) loadTasks()
  }, [employeeId, loadTasks])

  const createTask = async () => {
    if (!newTitle.trim() || !employeeId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tasks?adminId=${employeeId}`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        cache: 'no-store',
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || null, employeeId }),
      })
      if (!res.ok) { alert('No se pudo crear la tarea'); return }
      setNewTitle('')
      setNewDesc('')
      setModalOpen(false)
      await loadTasks()
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id: number, status: TaskStatus) => {
    setActionError(null)
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, status } : t)))
    try {
      const res = await fetch(`/api/tasks?id=${id}`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        cache: 'no-store',
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setActionError(err.message || 'No se pudo actualizar el estado')
        await loadTasks()
      }
    } catch {
      setActionError('Error de red al actualizar la tarea')
      await loadTasks()
    }
  }

  return {
    employeeId, tasks, loading, actionError, setActionError,
    modalOpen, setModalOpen, newTitle, setNewTitle, newDesc, setNewDesc,
    saving, attendanceStatus, canUpdate, loadTasks, loadAttendance,
    createTask, updateStatus
  }
}
