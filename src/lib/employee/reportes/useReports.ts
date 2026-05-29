import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AttendanceRecord, TaskRecord } from './types'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function firstOfMonthStr(): string {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

interface SalaryBalance {
  regularHours: number
  overtimeHours: number
  totalHours: number
  hourlyRate: number
  overtimeMultiplier: number
  estimatedGross: number | null
}

export function useReports() {
  const { user, token } = useAuth()

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [from, setFrom] = useState(firstOfMonthStr)
  const [to, setTo] = useState(todayStr)
  const [pendingFrom, setPendingFrom] = useState(firstOfMonthStr)
  const [pendingTo, setPendingTo] = useState(todayStr)

  const [hourlyRate, setHourlyRate] = useState(0)
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(1.5)
  const [overtimeThresholdHours, setOvertimeThresholdHours] = useState(8)

  const authHeaders = useMemo<HeadersInit>(() => {
    const h: Record<string, string> = {}
    if (token) h.Authorization = `Bearer ${token}`
    return h
  }, [token])

  const loadData = useCallback(async () => {
    if (!token || !user) return
    setLoading(true)
    try {
      const [histRes, taskRes, configRes, profileRes] = await Promise.all([
        fetch(`/api/attendance/history?limit=500&from=${from}&to=${to}`, { headers: authHeaders, cache: 'no-store' }),
        fetch(`/api/tasks?employeeId=${user.id}&limit=200`, { headers: authHeaders }),
        fetch('/api/employee/hr-config', { headers: authHeaders }),
        fetch('/api/employee/me', { headers: authHeaders }),
      ])

      type HrConfig = { overtime_multiplier?: number; overtime_threshold_hours?: number }
      type Profile = { contracts?: Array<{ hourlyRate?: number | string | null }> }

      const [histJson, taskJson, configJson, profileJson] = await Promise.all([
        histRes.ok ? histRes.json() : { data: [] },
        taskRes.ok ? taskRes.json() : { data: [] },
        configRes.ok ? (configRes.json() as Promise<HrConfig>) : Promise.resolve({} as HrConfig),
        profileRes.ok ? (profileRes.json() as Promise<Profile>) : Promise.resolve({} as Profile),
      ])

      setRecords(histJson.data ?? [])
      setTasks(taskJson.data ?? taskJson ?? [])

      if (configJson.overtime_multiplier) setOvertimeMultiplier(Number(configJson.overtime_multiplier))
      if (configJson.overtime_threshold_hours) setOvertimeThresholdHours(Number(configJson.overtime_threshold_hours))

      const activeContract = profileJson.contracts?.[0]
      const rate = activeContract ? Number(activeContract.hourlyRate ?? 0) : 0
      setHourlyRate(rate)
    } catch {
      // keep empty state
    } finally {
      setLoading(false)
    }
  }, [token, user, authHeaders, from, to])

  useEffect(() => { loadData() }, [loadData])

  const applyDateRange = useCallback(() => {
    setFrom(pendingFrom)
    setTo(pendingTo)
  }, [pendingFrom, pendingTo])

  const hoursPerDay = useMemo<number[]>(() => {
    const arr = Array(7).fill(0)
    for (const r of records) {
      const dayIdx = (new Date(r.startedAt).getDay() + 6) % 7
      arr[dayIdx] += Number(r.workedHours ?? 0)
    }
    return arr
  }, [records])

  const totalAccumulated = useMemo(
    () => records.reduce((s, r) => s + Number(r.workedHours ?? 0), 0),
    [records],
  )

  const salaryBalance = useMemo<SalaryBalance>(() => {
    let regularHours = 0
    let overtimeHours = 0
    for (const r of records) {
      const h = Number(r.workedHours ?? 0)
      const regular = Math.min(h, overtimeThresholdHours)
      const overtime = Math.max(0, h - overtimeThresholdHours)
      regularHours += regular
      overtimeHours += overtime
    }
    const estimatedGross = hourlyRate > 0
      ? regularHours * hourlyRate + overtimeHours * hourlyRate * overtimeMultiplier
      : null
    return { regularHours, overtimeHours, totalHours: regularHours + overtimeHours, hourlyRate, overtimeMultiplier, estimatedGross }
  }, [records, hourlyRate, overtimeMultiplier, overtimeThresholdHours])

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of tasks) {
      counts[t.status] = (counts[t.status] ?? 0) + 1
    }
    return counts
  }, [tasks])

  const exportCsv = useCallback(() => {
    const header = 'Fecha,Hora inicio,Hora fin,Horas trabajadas,Estado'
    const rows = records.map(r => {
      const start = new Date(r.startedAt)
      const end = r.endedAt ? new Date(r.endedAt) : null
      const date = start.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const startTime = start.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      const endTime = end ? end.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''
      const worked = Number(r.workedHours ?? 0).toFixed(2)
      const status = r.status === 'CLOSED' ? 'Completada' : r.status === 'PAUSED' ? 'Pausada' : 'Activa'
      return `${date},${startTime},${endTime},${worked},${status}`
    })

    const summary = [
      '',
      'RESUMEN',
      `Total horas,${salaryBalance.totalHours.toFixed(2)}`,
      `Horas regulares,${salaryBalance.regularHours.toFixed(2)}`,
      `Horas extras,${salaryBalance.overtimeHours.toFixed(2)}`,
      salaryBalance.estimatedGross !== null
        ? `Saldo estimado,${salaryBalance.estimatedGross.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'Saldo estimado,N/A (cargo mensual)',
    ]

    const csv = [header, ...rows, ...summary].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-asistencia-${from}-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [records, salaryBalance, from, to])

  return {
    records, tasks, loading, loadData,
    from, to, pendingFrom, pendingTo,
    setPendingFrom, setPendingTo, applyDateRange,
    hoursPerDay, totalAccumulated, taskCounts,
    salaryBalance, exportCsv,
  }
}
