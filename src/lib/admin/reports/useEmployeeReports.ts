import { useState, useCallback, useEffect, useMemo } from 'react'
import { KPIRecord, Range, Metrics, TimePoint, EmployeeRow } from '@/types/admin/employee-reports'

function avg(values: (number | null)[]): number | null {
  const clean = values.filter((v): v is number => v != null)
  return clean.length > 0 ? clean.reduce((s, v) => s + v, 0) / clean.length : null
}
function sum(values: (number | null)[]): number { return values.reduce((s: number, v) => s + Number(v ?? 0), 0) }
function formatDate(iso: string) { return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }) }

export function useEmployeeReports(token: string | null) {
  const [range, setRange] = useState<Range>('all')
  const [employeeFilter, setEmployeeFilter] = useState<number | null>(null)
  const [records, setRecords] = useState<KPIRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!token) return
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ range })
      if (employeeFilter) params.set('employeeId', String(employeeFilter))
      const res = await fetch(`/api/employee-kpis?${params}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setRecords(json.data ?? json ?? [])
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setLoading(false) }
  }, [token, range, employeeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const uniqueEmployees = useMemo(() => {
    const map = new Map<number, string>()
    records.forEach(r => map.set(r.employeeId, r.employee.name))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [records])

  // Weighted Average Calculation
  const calculateWeightedStats = (rows: KPIRecord[]) => {
    let totalHours = 0
    let totalTasks = 0
    let weightedProd = 0
    let weightedTime = 0
    let prodCount = 0
    let timeCount = 0

    rows.forEach(r => {
      const h = Number(r.totalWorkedHours ?? 0)
      const t = Number(r.tasksCompleted ?? 0)
      
      totalHours += h
      totalTasks += t

      if (r.productivityScore != null) {
        weightedProd += r.productivityScore * h
        prodCount += h
      }
      if (r.avgTaskTimeMinutes != null) {
        weightedTime += r.avgTaskTimeMinutes * t
        timeCount += t
      }
    })

    return {
      totalWorkedHours: totalHours,
      totalTasksCompleted: totalTasks,
      avgProductivity: prodCount > 0 ? weightedProd / prodCount : null,
      avgTaskTime: timeCount > 0 ? weightedTime / timeCount : null
    }
  }

  const metrics = useMemo<Metrics>(() => calculateWeightedStats(records), [records])

  const timeSeries = useMemo<TimePoint[]>(() => {
    const byDate = new Map<string, KPIRecord[]>()
    records.forEach(r => { const d = r.date.slice(0, 10); if (!byDate.has(d)) byDate.set(d, []); byDate.get(d)!.push(r) })
    
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, rows]) => {
        const stats = calculateWeightedStats(rows)
        return {
          date: formatDate(date),
          workedHours: stats.totalWorkedHours,
          tasksCompleted: stats.totalTasksCompleted,
          productivityScore: stats.avgProductivity
        }
      })
  }, [records])

  const employeeRows = useMemo<EmployeeRow[]>(() => {
    const byEmp = new Map<number, { name: string; rows: KPIRecord[] }>()
    records.forEach(r => { if (!byEmp.has(r.employeeId)) byEmp.set(r.employeeId, { name: r.employee.name, rows: [] }); byEmp.get(r.employeeId)!.rows.push(r) })
    
    return Array.from(byEmp.entries()).map(([id, { name, rows }]) => {
      const stats = calculateWeightedStats(rows)
      return {
        employeeId: id,
        name,
        totalWorkedHours: stats.totalWorkedHours,
        tasksCompleted: stats.totalTasksCompleted,
        avgTaskTime: stats.avgTaskTime,
        avgProductivity: stats.avgProductivity
      }
    })
  }, [records])

  return { range, setRange, employeeFilter, setEmployeeFilter, records, loading, error, fetchData, uniqueEmployees, metrics, timeSeries, employeeRows }
}
