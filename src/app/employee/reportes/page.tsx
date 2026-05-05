'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useAuth } from '@/context/AuthContext'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

// ── Types ──────────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: number
  status: 'OPEN' | 'PAUSED' | 'CLOSED'
  startedAt: string
  endedAt: string | null
  workedHours: string | number | null
}

interface TaskRecord {
  id: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_DONE' | 'CANCELLED'
}

// ── Constants ──────────────────────────────────────────────────────────────

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const TARGET_HOURS = 8

const TASK_COLORS: Record<string, string> = {
  PENDING:     '#F59E0B',
  IN_PROGRESS: '#3B82F6',
  COMPLETED:   '#22C55E',
  NOT_DONE:    '#EF4444',
  CANCELLED:   '#9CA3AF',
}
const TASK_LABELS: Record<string, string> = {
  PENDING:     'Pendientes',
  IN_PROGRESS: 'En Proceso',
  COMPLETED:   'Completadas',
  NOT_DONE:    'No Hechas',
  CANCELLED:   'Canceladas',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(hours: number) {
  if (!hours) return '—'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function startOfWeek(): Date {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  return monday
}

function statusBadge(status: string) {
  if (status === 'CLOSED') return 'bg-green-100 text-green-700'
  if (status === 'PAUSED') return 'bg-amber-100 text-amber-700'
  return 'bg-blue-100 text-blue-700'
}
const STATUS_LABEL: Record<string, string> = {
  CLOSED: 'Completada', PAUSED: 'Pausada', OPEN: 'Activa',
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ReportesPage() {
  const { user, token } = useAuth()

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [tasks,   setTasks]   = useState<TaskRecord[]>([])
  const [loading, setLoading] = useState(true)

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  )

  const loadData = useCallback(async () => {
    if (!token || !user) return
    setLoading(true)
    try {
      const [histRes, taskRes] = await Promise.all([
        fetch('/api/attendance/history?limit=200', { headers: authHeaders, cache: 'no-store' }),
        fetch(`/api/tasks?employeeId=${user.id}&limit=200`, { headers: authHeaders }),
      ])

      const [histJson, taskJson] = await Promise.all([
        histRes.ok  ? histRes.json()  : { data: [] },
        taskRes.ok  ? taskRes.json()  : { data: [] },
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

  // ── Derived data ──────────────────────────────────────────────────────────

  const weekStart = useMemo(startOfWeek, [])

  // Hours per weekday (current week only)
  const hoursPerDay = useMemo<number[]>(() => {
    const arr = Array(7).fill(0)
    for (const r of records) {
      if (new Date(r.startedAt) < weekStart) continue
      const dayIdx = (new Date(r.startedAt).getDay() + 6) % 7 // 0=Mon … 6=Sun
      arr[dayIdx] += Number(r.workedHours ?? 0)
    }
    return arr
  }, [records, weekStart])

  const totalAccumulated = useMemo(
    () => records.reduce((s, r) => s + Number(r.workedHours ?? 0), 0),
    [records],
  )

  // Task status distribution
  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of tasks) {
      counts[t.status] = (counts[t.status] ?? 0) + 1
    }
    return counts
  }, [tasks])

  // ── Chart configs ─────────────────────────────────────────────────────────

  const barData = useMemo(() => ({
    labels: WEEK_DAYS,
    datasets: [{
      label: 'Horas',
      data: hoursPerDay,
      backgroundColor: '#FF003B',
      borderRadius: 6,
    }],
  }), [hoursPerDay])

  const barOpts = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: Math.max(TARGET_HOURS, ...hoursPerDay, 1), ticks: { stepSize: 2 } },
    },
  }), [hoursPerDay])

  const doughnutData = useMemo(() => {
    const statuses = Object.keys(taskCounts).filter(k => taskCounts[k] > 0)
    if (statuses.length === 0) {
      // placeholder when no tasks
      return {
        labels: ['Sin tareas'],
        datasets: [{ data: [1], backgroundColor: ['#E5E7EB'], borderWidth: 0 }],
      }
    }
    return {
      labels: statuses.map(s => TASK_LABELS[s] ?? s),
      datasets: [{
        data: statuses.map(s => taskCounts[s]),
        backgroundColor: statuses.map(s => TASK_COLORS[s] ?? '#9CA3AF'),
        borderWidth: 0,
      }],
    }
  }, [taskCounts])

  const doughnutOpts = {
    responsive: true,
    cutout: '68%',
    plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 11 } } } },
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout
      pageTitle="Reportes y Analítica"
      navItems={NAV_ITEMS}
      onReload={loadData}
    >
      <h2 className="font-titles text-2xl font-extrabold text-[var(--color-nc-dark)]">
        Reportes y Analítica
      </h2>

      {/* Charts ------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-5">

        {/* Bar: hours per day */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
          <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)]">Horas por Día</p>
          <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50 mb-4">Distribución semanal</p>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-xs text-[var(--color-nc-dark)]/30 font-subtitles">Cargando…</div>
          ) : (
            <Bar data={barData} options={barOpts} />
          )}
        </div>

        {/* Doughnut: task distribution */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
          <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)]">Estado de Tareas</p>
          <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50 mb-4">Distribución actual</p>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-xs text-[var(--color-nc-dark)]/30 font-subtitles">Cargando…</div>
          ) : (
            <Doughnut data={doughnutData} options={doughnutOpts} />
          )}
        </div>

        {/* Progress bars: productivity vs 8h target */}
        <div className="bg-[var(--color-nc-dark)] rounded-2xl shadow-sm p-5">
          <p className="font-subtitles font-semibold text-sm text-white">Productividad Semanal</p>
          <p className="font-subtitles text-xs text-white/50 mb-4">Rendimiento por día (meta: {TARGET_HOURS}h)</p>
          <div className="flex flex-col gap-2.5">
            {WEEK_DAYS.map((day, i) => {
              const pct = Math.min(Math.round((hoursPerDay[i] / TARGET_HOURS) * 100), 100)
              return (
                <div key={day}>
                  <div className="flex justify-between text-xs font-subtitles text-white/70 mb-1">
                    <span>{day}</span>
                    <span>{loading ? '…' : `${pct}%`}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-nc-red)] to-pink-400 transition-all duration-500"
                      style={{ width: loading ? '0%' : `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* History Table ----------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <div>
            <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)]">Historial de Sesiones</p>
            <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50">
              Total acumulado:{' '}
              <strong className="text-[var(--color-nc-red)]">
                {loading ? '…' : formatDuration(totalAccumulated)}
              </strong>
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-10 text-sm text-[var(--color-nc-dark)]/40 font-subtitles">Cargando…</p>
        ) : records.length === 0 ? (
          <p className="text-center py-10 text-sm text-[var(--color-nc-dark)]/40 font-subtitles">Sin registros</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-subtitles">
              <thead className="bg-[#F7F8FA]">
                <tr>
                  {['Fecha', 'Hora Inicio', 'Hora Fin', 'Tiempo Total', 'Estado'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-[var(--color-nc-dark)]/50 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const start = new Date(r.startedAt)
                  const end   = r.endedAt ? new Date(r.endedAt) : null
                  return (
                    <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F7F8FA]/50'}>
                      <td className="px-6 py-3 text-[var(--color-nc-dark)]">
                        {start.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3 text-[var(--color-nc-dark)] tabular-nums">
                        {start.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-3 text-[var(--color-nc-dark)] tabular-nums">
                        {end ? end.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-6 py-3 font-semibold text-[var(--color-nc-dark)] tabular-nums">
                        {formatDuration(Number(r.workedHours ?? 0))}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(r.status)}`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
