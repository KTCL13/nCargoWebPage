'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer as RespCont
} from 'recharts'

type Alert = {
  type: string
  severity: 'low' | 'medium' | 'high'
  employeeId: number
  employeeName: string
  detail: string
}

type PerformanceEntry = {
  employeeId: number
  employeeName: string
  tasksCompleted: number
  avgCompletionMinutes: number | null
  totalWorkedHours: number
  notDoneCount: number
}

type WorkloadEntry = {
  employeeId: number
  employeeName: string
  totalTasks: number
  pendingCount: number
  inProgressCount: number
  completedCount: number
  notDoneCount: number
}

type CompletionEntry = {
  taskId: number
  title: string
  employeeId: number
  employeeName: string
  minutesSpent: number | null
}

type Employee = {
  id: number
  name: string
}

const SEVERITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
}

const SEVERITY_LABEL: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

const TYPE_LABEL: Record<string, string> = {
  UNCLOSED_ATTENDANCE: 'Jornada no cerrada',
  OVERDUE_TASK: 'Tarea no completada',
  NO_ACTIVITY: 'Sin actividad reciente',
  HIGH_NOT_DONE_RATE: 'Alta tasa de incumplimiento',
}

// ── Mock Data for Development ──────────────────────────────────────────
const MOCK_ALERTS: Alert[] = [
  { type: 'OVERDUE_TASK', severity: 'high', employeeId: 101, employeeName: 'Carlos Ruiz', detail: 'Tarea #402 vencida hace 2 días' },
  { type: 'UNCLOSED_ATTENDANCE', severity: 'medium', employeeId: 102, employeeName: 'Ana Beltrán', detail: 'Jornada abierta desde las 08:00 AM' },
  { type: 'HIGH_NOT_DONE_RATE', severity: 'high', employeeId: 103, employeeName: 'Lucas Paz', detail: '80% de tareas marcadas como No Hechas' },
]

const MOCK_PERFORMANCE: PerformanceEntry[] = [
  { employeeId: 1, employeeName: 'Carlos Ruiz', tasksCompleted: 12, avgCompletionMinutes: 45, totalWorkedHours: 40, notDoneCount: 1 },
  { employeeId: 2, employeeName: 'Ana Beltrán', tasksCompleted: 15, avgCompletionMinutes: 38, totalWorkedHours: 38, notDoneCount: 0 },
  { employeeId: 3, employeeName: 'Lucas Paz', tasksCompleted: 5, avgCompletionMinutes: 120, totalWorkedHours: 35, notDoneCount: 4 },
  { employeeId: 4, employeeName: 'Elena Sol', tasksCompleted: 20, avgCompletionMinutes: 30, totalWorkedHours: 42, notDoneCount: 0 },
]

const MOCK_WORKLOAD: WorkloadEntry[] = [
  { employeeId: 1, employeeName: 'Carlos Ruiz', totalTasks: 15, pendingCount: 2, inProgressCount: 1, completedCount: 12, notDoneCount: 0 },
  { employeeId: 2, employeeName: 'Ana Beltrán', totalTasks: 18, pendingCount: 3, inProgressCount: 0, completedCount: 15, notDoneCount: 0 },
  { employeeId: 3, employeeName: 'Lucas Paz', totalTasks: 20, pendingCount: 10, inProgressCount: 1, completedCount: 5, notDoneCount: 4 },
]

const MOCK_COMPLETION: CompletionEntry[] = [
  { taskId: 401, title: 'Revisión Aduana', employeeId: 1, employeeName: 'Carlos Ruiz', minutesSpent: 40 },
  { taskId: 405, title: 'Despacho Aéreo', employeeId: 2, employeeName: 'Ana Beltrán', minutesSpent: 25 },
  { taskId: 410, title: 'Carga de Contenedor', employeeId: 4, employeeName: 'Elena Sol', minutesSpent: 55 },
]

function fmt(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded-lg" />
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center text-gray-400 text-sm">{message}</div>
  )
}

export default function ReportesPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [performance, setPerformance] = useState<PerformanceEntry[]>([])
  const [workload, setWorkload] = useState<WorkloadEntry[]>([])
  const [completion, setCompletion] = useState<CompletionEntry[]>([])

  const [employees, setEmployees] = useState<Employee[]>([])

  // Filters
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')

  const [loading, setLoading] = useState({
    alerts: true,
    performance: true,
    workload: true,
    completion: true,
  })

  const fetchAll = useCallback(async () => {
    setLoading({ alerts: true, performance: true, workload: true, completion: true })

    const params = new URLSearchParams()
    if (fromDate) params.append('from', new Date(fromDate).toISOString())
    if (toDate) params.append('to', new Date(toDate).toISOString())
    if (selectedEmployeeId) params.append('employeeId', selectedEmployeeId)

    const query = params.toString() ? `?${params.toString()}` : ''

    const [alertsRes, perfRes, workloadRes, completionRes] = await Promise.allSettled([
      fetch(`/api/analytics/alerts${query}`).then(r => r.json()),
      fetch(`/api/analytics/employee-performance${query}`).then(r => r.json()),
      fetch(`/api/analytics/workload${query}`).then(r => r.json()),
      fetch(`/api/analytics/task-completion${query}`).then(r => r.json()),
    ])

    // Helper to resolve data (Real API with Mock Fallback if Empty)
    const resolve = (res: PromiseSettledResult<any>, mock: any[]) => {
      if (res.status === 'fulfilled' && Array.isArray(res.value) && res.value.length > 0) {
        return res.value
      }
      // If API fails or is empty, use mock during dev/demo
      return mock
    }

    setAlerts(resolve(alertsRes, MOCK_ALERTS))
    setLoading(l => ({ ...l, alerts: false }))

    setPerformance(resolve(perfRes, MOCK_PERFORMANCE))
    setLoading(l => ({ ...l, performance: false }))

    setWorkload(resolve(workloadRes, MOCK_WORKLOAD))
    setLoading(l => ({ ...l, workload: false }))

    setCompletion(resolve(completionRes, MOCK_COMPLETION))
    setLoading(l => ({ ...l, completion: false }))
  }, [fromDate, toDate, selectedEmployeeId])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Fetch employees for filter
  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(data => setEmployees(Array.isArray(data) ? data : (data.data ?? [])))
      .catch(() => { })
  }, [])

  const highAlerts = alerts.filter(a => a.severity === 'high').length

  // Transform data for charts
  const pieData = useMemo(() => {
    const stats = workload.reduce((acc, curr) => {
      acc.pending += curr.pendingCount;
      acc.inProgress += curr.inProgressCount;
      acc.completed += curr.completedCount;
      acc.notDone += curr.notDoneCount;
      return acc;
    }, { pending: 0, inProgress: 0, completed: 0, notDone: 0 });

    return [
      { name: 'Pendientes', value: stats.pending, color: '#facc15' }, // yellow-400
      { name: 'En Proceso', value: stats.inProgress, color: '#3b82f6' }, // blue-500
      { name: 'Completadas', value: stats.completed, color: '#22c55e' }, // green-500
      { name: 'No Hechas', value: stats.notDone, color: '#ef4444' }, // red-500
    ].filter(d => d.value > 0);
  }, [workload]);

  const barData = useMemo(() => {
    return performance.map(p => ({
      name: p.employeeName.split(' ')[0], // Use first name for bar chart
      completadas: p.tasksCompleted,
      horas: Math.round(p.totalWorkedHours)
    })).slice(0, 8); // Top 8 employees
  }, [performance]);

  return (
    <DashboardLayout
      pageTitle="Reportes"
      navItems={NAV_ITEMS}
      onReload={fetchAll}
    >
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-titles text-2xl font-extrabold text-[var(--color-foreground)]">
              Reportes y Analítica
            </h1>
            <p className="text-gray-500 text-sm mt-1">Rendimiento, carga de trabajo y alertas del equipo</p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-[var(--radius-lg)] border border-gray-100 shadow-sm">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Desde</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="form-input text-xs py-1.5"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Hasta</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="form-input text-xs py-1.5"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Empleado</label>
              <select
                value={selectedEmployeeId}
                onChange={e => setSelectedEmployeeId(e.target.value)}
                className="form-input text-xs py-1.5 pr-8"
              >
                <option value="">Todos</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchAll}
              className="mt-5 p-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition shadow-sm"
              title="Actualizar filtros"
            >
              🔄
            </button>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon="🚨" label="Alertas activas" value={loading.alerts ? '—' : alerts.length} accent="bg-red-50 border-red-100" />
          <KpiCard icon="✅" label="Tareas completadas" value={loading.performance ? '—' : performance.reduce((s, p) => s + p.tasksCompleted, 0)} />
          <KpiCard icon="⚡" label="En progreso" value={loading.workload ? '—' : workload.reduce((s, w) => s + w.inProgressCount, 0)} />
          <KpiCard icon="⏱️" label="Horas trabajadas" value={loading.performance ? '—' : Math.round(performance.reduce((s, p) => s + p.totalWorkedHours, 0))} />
        </div>

        {/* Visual Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="📊 Distribución Global de Estado">
            <div className="h-[300px] w-full">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ReTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No hay tareas registradas para este periodo." />
              )}
            </div>
          </Section>

          <Section title="🏆 Top Rendimiento (Tareas vs Horas)">
            <div className="h-[300px] w-full">
              {barData.length > 0 ? (
                <RespCont width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#f9fafb' }} />
                    <Legend />
                    <Bar dataKey="completadas" name="Tareas" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="horas" name="Horas" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </RespCont>
              ) : (
                <EmptyState message="No hay datos de rendimiento disponibles." />
              )}
            </div>
          </Section>
        </div>

        {/* Alerts */}
        <Section title="🚨 Alertas del Sistema" badge={highAlerts > 0 ? `${highAlerts} alta prioridad` : undefined}>
          {loading.alerts ? <LoadingSkeleton rows={3} /> : alerts.length === 0 ? (
            <EmptyState message="Sin alertas activas. Todo marcha bien." />
          ) : (
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${SEVERITY_STYLES[a.severity]}`}>
                  <span className="font-bold text-xs mt-0.5 whitespace-nowrap">
                    {SEVERITY_LABEL[a.severity]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold">{TYPE_LABEL[a.type] ?? a.type}</span>
                    {' · '}
                    <span className="font-medium">{a.employeeName}</span>
                    <p className="text-xs opacity-70 truncate mt-0.5">{a.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Employee Performance */}
        <Section title="📈 Rendimiento de Empleados">
          {loading.performance ? <LoadingSkeleton /> : performance.length === 0 ? (
            <EmptyState message="Sin datos de rendimiento." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                    <th className="pb-3 pr-4">Empleado</th>
                    <th className="pb-3 pr-4 text-right">Tareas completadas</th>
                    <th className="pb-3 pr-4 text-right">Tiempo promedio</th>
                    <th className="pb-3 pr-4 text-right">Horas trabajadas</th>
                    <th className="pb-3 text-right">No completadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {performance.map(p => (
                    <tr key={p.employeeId} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 font-medium">{p.employeeName}</td>
                      <td className="py-3 pr-4 text-right text-green-600 font-bold">{p.tasksCompleted}</td>
                      <td className="py-3 pr-4 text-right text-gray-600">{fmt(p.avgCompletionMinutes)}</td>
                      <td className="py-3 pr-4 text-right text-gray-600">{p.totalWorkedHours}h</td>
                      <td className="py-3 text-right">
                        {p.notDoneCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">{p.notDoneCount}</span>
                        ) : (
                          <span className="text-gray-300 text-xs">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Workload Distribution */}
        <Section title="⚖️ Distribución de Carga">
          {loading.workload ? <LoadingSkeleton /> : workload.length === 0 ? (
            <EmptyState message="Sin datos de carga de trabajo." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                    <th className="pb-3 pr-4">Empleado</th>
                    <th className="pb-3 pr-4 text-right">Total</th>
                    <th className="pb-3 pr-4 text-right">Pendientes</th>
                    <th className="pb-3 pr-4 text-right">En progreso</th>
                    <th className="pb-3 pr-4 text-right">Completadas</th>
                    <th className="pb-3 text-right">No hechas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {workload.map(w => (
                    <tr key={w.employeeId} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 font-medium">{w.employeeName}</td>
                      <td className="py-3 pr-4 text-right font-bold">{w.totalTasks}</td>
                      <td className="py-3 pr-4 text-right text-yellow-600">{w.pendingCount}</td>
                      <td className="py-3 pr-4 text-right text-blue-600">{w.inProgressCount}</td>
                      <td className="py-3 pr-4 text-right text-green-600">{w.completedCount}</td>
                      <td className="py-3 text-right">
                        {w.notDoneCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">{w.notDoneCount}</span>
                        ) : (
                          <span className="text-gray-300 text-xs">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Task Completion Times */}
        <Section title="⏱️ Tiempos de Completitud de Tareas">
          {loading.completion ? <LoadingSkeleton /> : completion.length === 0 ? (
            <EmptyState message="Sin tareas completadas en el período." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">Tarea</th>
                    <th className="pb-3 pr-4">Empleado</th>
                    <th className="pb-3 text-right">Tiempo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {completion.map(c => (
                    <tr key={c.taskId} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 text-gray-400 text-xs font-mono">#{c.taskId}</td>
                      <td className="py-3 pr-4 font-medium truncate max-w-[200px]">{c.title}</td>
                      <td className="py-3 pr-4 text-gray-600">{c.employeeName}</td>
                      <td className="py-3 text-right font-mono text-gray-700">{fmt(c.minutesSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

      </div>
    </DashboardLayout>
  )
}

function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[var(--radius-xl)] border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="font-titles text-base font-bold text-gray-900">{title}</h2>
        {badge && (
          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">{badge}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function KpiCard({ icon, label, value, accent = 'bg-white border-gray-100' }: { icon: string; label: string; value: number | string; accent?: string }) {
  return (
    <div className={`rounded-[var(--radius-xl)] border p-5 shadow-sm ${accent}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-3xl font-extrabold text-gray-900">{value}</div>
    </div>
  )
}
