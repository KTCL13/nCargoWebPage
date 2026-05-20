import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AttendanceRecord, TaskRecord } from './types'

function startOfWeek(): Date {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function useReports() {
  const { user, token } = useAuth()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [loading, setLoading] = useState(true)

  const authHeaders = useMemo<HeadersInit>(() => {
    const h: Record<string, string> = {}
    if (token) h.Authorization = `Bearer ${token}`
    return h
  }, [token])

  const loadData = useCallback(async () => {
    if (!token || !user) return
    setLoading(true)
    try {
      const [histRes, taskRes] = await Promise.all([
        fetch('/api/attendance/history?limit=200', { headers: authHeaders, cache: 'no-store' }),
        fetch(`/api/tasks?employeeId=${user.id}&limit=200`, { headers: authHeaders }),
      ])

      const [histJson, taskJson] = await Promise.all([
        histRes.ok ? histRes.json() : { data: [] },
        taskRes.ok ? taskRes.json() : { data: [] },
      ])

      setRecords(histJson.data ?? [])
      setTasks(taskJson.data ?? taskJson ?? [])
    } catch {
      // keep empty state
    } finally {
      setLoading(false)
    }
  }, [token, user, authHeaders])

  useEffect(() => { loadData() }, [loadData])

  const weekStart = useMemo(startOfWeek, [])

  const hoursPerDay = useMemo<number[]>(() => {
    const arr = Array(7).fill(0)
    for (const r of records) {
      if (new Date(r.startedAt) < weekStart) continue
      const dayIdx = (new Date(r.startedAt).getDay() + 6) % 7
      arr[dayIdx] += Number(r.workedHours ?? 0)
    }
    return arr
  }, [records, weekStart])

  const totalAccumulated = useMemo(
    () => records.reduce((s, r) => s + Number(r.workedHours ?? 0), 0),
    [records],
  )

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of tasks) {
      counts[t.status] = (counts[t.status] ?? 0) + 1
    }
    return counts
  }, [tasks])

  return {
    records, tasks, loading, loadData,
    hoursPerDay, totalAccumulated, taskCounts
  }
}
