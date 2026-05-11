'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useAuth } from '@/context/AuthContext'
import { MetricCards, type Metrics } from './_components/MetricCards'
import { Charts, type TimePoint } from './_components/Charts'
import { EmployeeTable, type EmployeeRow } from './_components/EmployeeTable'

// ── Types ──────────────────────────────────────────────────────────────────

type Range = '7d' | '30d' | '90d' | 'all'

type KPIRecord = {
  id: number
  employeeId: number
  date: string
  tasksCompleted: number
  tasksPending: number
  avgTaskTimeMinutes: number | null
  totalWorkedHours: number | null
  productivityScore: number | null
  employee: { id: number; name: string }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function avg(values: (number | null)[]): number | null {
  const clean = values.filter((v): v is number => v != null)
  return clean.length > 0 ? clean.reduce((s, v) => s + v, 0) / clean.length : null
}

function sum(values: (number | null)[]): number {
  return values.reduce((s: number, v) => s + Number(v ?? 0), 0)
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EmployeeReportsPage() {
  const { user, token } = useAuth()
  const router          = useRouter()

  const [range,           setRange]           = useState<Range>('all')
  const [employeeFilter,  setEmployeeFilter]  = useState<number | null>(null)
  const [records,         setRecords]         = useState<KPIRecord[]>([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState<string | null>(null)

  // Admin guard
  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/admin/dashboard')
  }, [user, router])

  // Fetch KPI records
  const fetchData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ range })
      if (employeeFilter) params.set('employeeId', String(employeeFilter))
      const res = await fetch(`/api/employee-kpis?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setRecords(json.data ?? json ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [token, range, employeeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Derived data (all memoised) ──────────────────────────────────────────

  // Unique employees for the filter dropdown
  const uniqueEmployees = useMemo(() => {
    const map = new Map<number, string>()
    records.forEach(r => map.set(r.employeeId, r.employee.name))
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [records])

  // Metric card totals / averages
  const metrics = useMemo<Metrics>(() => ({
    totalWorkedHours:    sum(records.map(r => r.totalWorkedHours)),
    totalTasksCompleted: sum(records.map(r => r.tasksCompleted)),
    avgProductivity:     avg(records.map(r => r.productivityScore)),
    avgTaskTime:         avg(records.map(r => r.avgTaskTimeMinutes)),
  }), [records])

  // Time-series data for charts: group by calendar date, aggregate across employees
  const timeSeries = useMemo<TimePoint[]>(() => {
    const byDate = new Map<string, KPIRecord[]>()
    records.forEach(r => {
      const d = r.date.slice(0, 10)
      if (!byDate.has(d)) byDate.set(d, [])
      byDate.get(d)!.push(r)
    })
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, rows]) => ({
        date:             formatDate(date),
        workedHours:      sum(rows.map(r => r.totalWorkedHours)),
        tasksCompleted:   sum(rows.map(r => r.tasksCompleted)),
        productivityScore: avg(rows.map(r => r.productivityScore)),
      }))
  }, [records])

  // Per-employee aggregated rows for the table
  const employeeRows = useMemo<EmployeeRow[]>(() => {
    const byEmp = new Map<number, { name: string; rows: KPIRecord[] }>()
    records.forEach(r => {
      if (!byEmp.has(r.employeeId)) byEmp.set(r.employeeId, { name: r.employee.name, rows: [] })
      byEmp.get(r.employeeId)!.rows.push(r)
    })
    return Array.from(byEmp.entries()).map(([id, { name, rows }]) => ({
      employeeId:       id,
      name,
      totalWorkedHours: sum(rows.map(r => r.totalWorkedHours)),
      tasksCompleted:   sum(rows.map(r => r.tasksCompleted)),
      avgTaskTime:      avg(rows.map(r => r.avgTaskTimeMinutes)),
      avgProductivity:  avg(rows.map(r => r.productivityScore)),
    }))
  }, [records])

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout
      pageTitle="KPIs Empleados"
      navItems={NAV_ITEMS}
      onReload={fetchData}
    >
      {/* Header + filters ------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-titles text-2xl font-extrabold text-[var(--color-nc-dark)]">
            KPIs de Empleados
          </h2>
          <p className="font-subtitles text-sm text-[var(--color-nc-dark)]/50 mt-0.5">
            Métricas de rendimiento del equipo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Range toggle */}
          <div className="flex rounded-xl border border-black/10 overflow-hidden text-sm font-subtitles">
            {([
              { key: '7d',  label: '7d'    },
              { key: '30d', label: '30d'   },
              { key: '90d', label: '90d'   },
              { key: 'all', label: 'Todo'  },
            ] as { key: Range; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`px-3 py-2 transition-colors ${
                  range === key
                    ? 'bg-[var(--color-nc-dark)] text-white'
                    : 'bg-white text-[var(--color-nc-dark)]/60 hover:bg-black/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Employee filter */}
          {uniqueEmployees.length > 1 && (
            <select
              value={employeeFilter ?? ''}
              onChange={e => setEmployeeFilter(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 text-sm font-subtitles rounded-xl border border-black/10 bg-white text-[var(--color-nc-dark)] outline-none cursor-pointer"
            >
              <option value="">Todos los empleados</option>
              {uniqueEmployees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* States ---------------------------------------------------------- */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-subtitles text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <div className="w-8 h-8 border-2 border-[var(--color-nc-blue)] border-t-transparent rounded-full animate-spin" />
          <p className="font-subtitles text-sm text-[var(--color-nc-dark)]/40">Cargando KPIs…</p>
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <span className="text-5xl">📊</span>
          <div className="text-center">
            <p className="font-subtitles font-semibold text-[var(--color-nc-dark)]/60 text-base">
              Sin datos de KPI para este período
            </p>
            <p className="font-subtitles text-sm text-[var(--color-nc-dark)]/35 mt-1 max-w-xs">
              Los KPIs se generan automáticamente al finalizar cada jornada laboral.
            </p>
          </div>
        </div>
      ) : (
        <>
          <MetricCards metrics={metrics} />
          <Charts timeSeries={timeSeries} />
          <EmployeeTable rows={employeeRows} />
        </>
      )}
    </DashboardLayout>
  )
}
