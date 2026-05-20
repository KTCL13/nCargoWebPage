import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

export type DashboardEmployee = {
  id: number
  name: string
  email: string
  status: 'ACTIVE' | 'INACTIVE'
  roles: string[]
  activeContract: { id: number; job: { title: string } } | null
}

export type WorkloadEntry = {
  employeeId: number
  employeeName: string
  totalTasks: number
  pendingCount: number
  inProgressCount: number
  completedCount: number
  notDoneCount: number
}

const PIE_COLORS = [
  { name: 'Pendientes',   key: 'pendingCount',    color: '#facc15' },
  { name: 'En Proceso',   key: 'inProgressCount', color: '#3b82f6' },
  { name: 'Completadas',  key: 'completedCount',  color: '#22c55e' },
  { name: 'No Hechas',    key: 'notDoneCount',    color: '#ef4444' },
]

export function useDashboard() {
  const { token } = useAuth()
  const [activeCount, setActiveCount] = useState<number | null>(null)
  const [inProgressTasks, setInProgressTasks] = useState<number | null>(null)
  const [todayAttendances, setTodayAttendances] = useState<number | null>(null)
  const [totalQuotations, setTotalQuotations] = useState<number | null>(null)
  const [recentEmployees, setRecentEmployees] = useState<DashboardEmployee[]>([])
  const [pieData, setPieData] = useState<{ name: string; value: number; color: string }[]>([])

  const fetchAll = useCallback(async () => {
    if (!token) return
    const auth = { Authorization: `Bearer ${token}` }

    const [empRes, workloadRes, attendanceRes, quotationsRes] = await Promise.allSettled([
      fetch('/api/employees?status=ACTIVE&limit=1', { headers: auth }).then(r => r.json()),
      fetch('/api/analytics/workload', { headers: auth }).then(r => r.json()),
      fetch('/api/attendance?page=1&pageSize=1', { headers: auth }).then(r => r.json()),
      fetch('/api/quotations?page=1&limit=1', { headers: auth }).then(r => r.json()),
    ])

    if (empRes.status === 'fulfilled') setActiveCount(empRes.value.total ?? 0)
    if (workloadRes.status === 'fulfilled' && Array.isArray(workloadRes.value)) {
      const rows = workloadRes.value as WorkloadEntry[]
      setInProgressTasks(rows.reduce((acc, e) => acc + e.inProgressCount, 0))
      const totals = PIE_COLORS.map(c => ({
        name: c.name,
        color: c.color,
        value: rows.reduce((acc, e) => acc + (e[c.key as keyof WorkloadEntry] as number), 0),
      })).filter(d => d.value > 0)
      setPieData(totals)
    }
    if (attendanceRes.status === 'fulfilled') setTodayAttendances(attendanceRes.value.total ?? 0)
    if (quotationsRes.status === 'fulfilled') setTotalQuotations(quotationsRes.value.total ?? 0)

    try {
      const empList = await fetch('/api/employees?page=1&limit=4', { headers: auth }).then(r => r.json())
      setRecentEmployees(empList.data ?? [])
    } catch { /* silent */ }
  }, [token])

  useEffect(() => { fetchAll() }, [fetchAll])

  return {
    activeCount, inProgressTasks, todayAttendances, totalQuotations,
    recentEmployees, pieData, fetchAll
  }
}
