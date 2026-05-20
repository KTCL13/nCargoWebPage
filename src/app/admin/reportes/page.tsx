'use client'

import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useAuth } from '@/context/AuthContext'
import { Pagination } from '@/components/ui/Pagination'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { useReports } from '@/lib/admin/reports/useReports'
import { SEVERITY_ORDER, SEVERITY_STYLES, SEVERITY_LABEL, TYPE_LABEL } from '@/types/admin/reports'
import { EmployeeSearch } from '@/components/ui/EmployeeSearch'

const PAGE_SIZE = 10
const PERF_LIMIT = 10

function fmt(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function paged<T>(arr: T[], page: number): T[] {
  return arr.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
}

function sortBy<T>(items: T[], sortKey: string, customOrder?: Record<string, number>): T[] {
  const sep = sortKey.lastIndexOf('_')
  const field = sortKey.slice(0, sep) as keyof T
  const dir = sortKey.slice(sep + 1) as 'asc' | 'desc'
  return [...items].sort((a, b) => {
    const av = a[field]; const bv = b[field]
    if (customOrder) {
      const ao = customOrder[av as string] ?? 99; const bo = customOrder[bv as string] ?? 99
      return dir === 'asc' ? ao - bo : bo - ao
    }
    if (av === null || av === undefined) return 1
    if (bv === null || bv === undefined) return -1
    if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
    return dir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })
}

export default function ReportesPage() {
  const { token } = useAuth()
  const {
    alerts, performance, perfTotal, perfPage, workload, completion, employees,
    fromDate, setFromDate, toDate, setToDate, selectedEmployeeId, setSelectedEmployeeId,
    appliedFilters, setAppliedFilters, loading, fetchMain, handlePerfPageChange
  } = useReports(token)

  const [alertPage, setAlertPage] = useState(0)
  const [workloadPage, setWorkloadPage] = useState(0)
  const [completionPage, setCompletionPage] = useState(0)

  const [alertSort, setAlertSort] = useState('severity_asc')
  const [workloadSort, setWorkloadSort] = useState('totalTasks_desc')
  const [completionSort, setCompletionSort] = useState('minutesSpent_asc')
  const [perfSort, setPerfSort] = useState('tasksCompleted_desc')

  const sortedAlerts = useMemo(() => sortBy(alerts, alertSort, alertSort.startsWith('severity') ? SEVERITY_ORDER : undefined), [alerts, alertSort])
  const pagedAlerts = useMemo(() => paged(sortedAlerts, alertPage), [sortedAlerts, alertPage])
  const sortedWorkload = useMemo(() => sortBy(workload, workloadSort), [workload, workloadSort])
  const pagedWorkload = useMemo(() => paged(sortedWorkload, workloadPage), [sortedWorkload, workloadPage])
  const sortedCompletion = useMemo(() => {
    const sep = completionSort.lastIndexOf('_'); const field = completionSort.slice(0, sep); const dir = completionSort.slice(sep + 1) as 'asc' | 'desc'
    if (field === 'minutesSpent') return [...completion].sort((a, b) => {
      const av = a.minutesSpent ?? (dir === 'asc' ? Infinity : -Infinity); const bv = b.minutesSpent ?? (dir === 'asc' ? Infinity : -Infinity)
      return dir === 'asc' ? av - bv : bv - av
    })
    return sortBy(completion, completionSort)
  }, [completion, completionSort])
  const pagedCompletion = useMemo(() => paged(sortedCompletion, completionPage), [sortedCompletion, completionPage])
  const sortedPerformance = useMemo(() => sortBy(performance, perfSort), [performance, perfSort])

  const barData = useMemo(() => [...performance].sort((a, b) => b.tasksCompleted - a.tasksCompleted).slice(0, 8).map(p => ({ name: p.employeeName.split(' ')[0], completadas: p.tasksCompleted, horas: Math.round(p.totalWorkedHours) })), [performance])
  const pieData = useMemo(() => {
    const s = workload.reduce((acc, c) => ({ pending: acc.pending + c.pendingCount, inProgress: acc.inProgress + c.inProgressCount, completed: acc.completed + c.completedCount, notDone: acc.notDone + c.notDoneCount }), { pending: 0, inProgress: 0, completed: 0, notDone: 0 })
    return [{ name: 'Pendientes', value: s.pending, color: '#facc15' }, { name: 'En Proceso', value: s.inProgress, color: '#3b82f6' }, { name: 'Completadas', value: s.completed, color: '#22c55e' }, { name: 'No Hechas', value: s.notDone, color: '#ef4444' }].filter(d => d.value > 0)
  }, [workload])

  const highAlerts = alerts.filter(a => a.severity === 'high').length

  const handleExportCSV = () => {
    const lines = [['"Reportes y Analítica — nCargo"'], [`"${[appliedFilters.from ? `Desde: ${appliedFilters.from}` : '', appliedFilters.to ? `Hasta: ${appliedFilters.to}` : ''].filter(Boolean).join(' | ') || 'Todo el período'}"`], [], ['=== RENDIMIENTO DE EMPLEADOS ==='], ['Empleado', 'Tareas Completadas', 'Tiempo Promedio', 'Horas Trabajadas', 'No Completadas'], ...sortedPerformance.map(p => [`"${p.employeeName}"`, p.tasksCompleted, fmt(p.avgCompletionMinutes), `${p.totalWorkedHours}h`, p.notDoneCount]), [], ['=== DISTRIBUCIÓN DE CARGA ==='], ['Empleado', 'Total', 'Pendientes', 'En Progreso', 'Completadas', 'No Hechas'], ...sortedWorkload.map(w => [`"${w.employeeName}"`, w.totalTasks, w.pendingCount, w.inProgressCount, w.completedCount, w.notDoneCount])]
    const csv = lines.map(r => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `reporte-ncargo-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const win = window.open('', '_blank', 'width=960,height=720')
    if (!win) return
    const dateRange = [appliedFilters.from ? `Desde: ${appliedFilters.from}` : '', appliedFilters.to ? `Hasta: ${appliedFilters.to}` : ''].filter(Boolean).join(' · ') || 'Todo el período'
    const perfStart = perfTotal === 0 ? 0 : perfPage * PERF_LIMIT + 1
    const perfEnd = Math.min((perfPage + 1) * PERF_LIMIT, perfTotal)
    const tr = (cells: string[]) => `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`
    const perfRows = sortedPerformance.map(p => tr([p.employeeName, String(p.tasksCompleted), fmt(p.avgCompletionMinutes), `${p.totalWorkedHours}h`, String(p.notDoneCount)])).join('') || '<tr><td colspan="5" style="text-align:center;color:#999">Sin datos</td></tr>'
    const wlRows = sortedWorkload.map(w => tr([w.employeeName, String(w.totalTasks), String(w.pendingCount), String(w.inProgressCount), String(w.completedCount), String(w.notDoneCount)])).join('') || '<tr><td colspan="6" style="text-align:center;color:#999">Sin datos</td></tr>'
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reporte nCargo</title><style>body{font-family:Arial,sans-serif;font-size:12px;color:#333;margin:24px}h1{font-size:20px;margin:0 0 2px}.sub{font-size:11px;color:#666;margin:0 0 20px}h2{font-size:13px;margin:20px 0 6px;padding-bottom:4px;border-bottom:2px solid #eee;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#f5f5f5;font-weight:bold;padding:6px 8px;border:1px solid #ddd;font-size:11px;text-align:left}td{padding:5px 8px;border:1px solid #eee}tr:nth-child(even){background:#fafafa}@media print{body{margin:0}}</style></head><body><h1>Reportes y Analítica — nCargo</h1><p class="sub">Generado el ${new Date().toLocaleString('es')} · ${dateRange}</p><h2>Rendimiento de Empleados (${perfStart}–${perfEnd} de ${perfTotal})</h2><table><thead><tr><th>Empleado</th><th>Tareas</th><th>Tiempo prom.</th><th>Horas</th><th>No completadas</th></tr></thead><tbody>${perfRows}</tbody></table><h2>Distribución de Carga</h2><table><thead><tr><th>Empleado</th><th>Total</th><th>Pendientes</th><th>En progreso</th><th>Completadas</th><th>No hechas</th></tr></thead><tbody>${wlRows}</tbody></table><script>window.onload=function(){window.print()}</script></body></html>`)
    win.document.close()
  }

  return (
    <DashboardLayout pageTitle="Reportes" navItems={NAV_ITEMS} onReload={fetchMain}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="font-titles text-2xl font-extrabold text-[var(--color-foreground)]">Reportes y Analítica</h1><p className="text-gray-500 text-sm mt-1">Rendimiento, carga de trabajo y alertas del equipo</p></div>
          <div className="flex flex-wrap items-end gap-3 bg-white p-3 rounded-[var(--radius-lg)] border border-gray-100 shadow-sm">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Desde</label>
              <input 
                type="date" 
                value={fromDate} 
                onChange={e => {
                  const newFrom = e.target.value
                  setFromDate(newFrom)
                  if (toDate && newFrom > toDate) setToDate(newFrom)
                }} 
                className="form-input text-xs py-1.5" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Hasta</label>
              <input 
                type="date" 
                value={toDate} 
                min={fromDate}
                onChange={e => setToDate(e.target.value)} 
                className="form-input text-xs py-1.5" 
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[240px]">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Empleado</label>
              <EmployeeSearch 
                onSelect={emp => setSelectedEmployeeId(emp ? String(emp.id) : '')} 
                placeholder="Nombre o ID..." 
              />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setAppliedFilters({ from: fromDate, to: toDate, employeeId: selectedEmployeeId })} className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold hover:opacity-90 transition shadow-sm">🔄 Filtrar</button>
              <button onClick={handleExportCSV} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:opacity-90 transition shadow-sm">📊 Excel</button>
              <button onClick={handleExportPDF} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:opacity-90 transition shadow-sm">📄 PDF</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon="🚨" label="Alertas" value={loading.alerts ? '—' : alerts.length} accent="bg-red-50 border-red-100" />
          <KpiCard icon="✅" label="Tareas OK" value={loading.performance ? '—' : performance.reduce((s, p) => s + p.tasksCompleted, 0)} />
          <KpiCard icon="⚡" label="En proceso" value={loading.workload ? '—' : workload.reduce((s, w) => s + w.inProgressCount, 0)} />
          <KpiCard icon="⏱️" label="Horas" value={loading.performance ? '—' : Math.round(performance.reduce((s, p) => s + p.totalWorkedHours, 0))} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="📊 Estado Global">
            <div className="h-[300px] w-full relative">
              {loading.workload ? <LoadingSkeleton rows={1} /> : pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0} debounce={50}><PieChart><Pie data={pieData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">{pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><ReTooltip /><Legend /></PieChart></ResponsiveContainer>
              ) : <EmptyState message="Sin datos." />}
            </div>
          </Section>
          <Section title="🏆 Top Rendimiento">
            <div className="h-[240px] w-full relative">
              {loading.performance ? <LoadingSkeleton rows={1} /> : barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240} minWidth={0} minHeight={0} debounce={50}><BarChart data={barData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} /><YAxis fontSize={10} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: '#f9fafb' }} /><Legend /><Bar dataKey="completadas" name="Tareas" fill="var(--color-primary)" radius={[4, 4, 0, 0]} /><Bar dataKey="horas" name="Horas" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
              ) : <EmptyState message="Sin datos." />}
            </div>
          </Section>
        </div>

        <Section title="🚨 Alertas" badge={highAlerts > 0 ? `${highAlerts} prioridad` : undefined} actions={<SortSelect value={alertSort} onChange={v => { setAlertSort(v); setAlertPage(0) }} options={[{ value: 'severity_asc', label: 'Severidad' }, { value: 'employeeName_asc', label: 'Empleado' }]} />}>
          {loading.alerts ? <LoadingSkeleton rows={3} /> : sortedAlerts.length === 0 ? <EmptyState message="Todo bien." /> : (
            <><div className="space-y-2">{pagedAlerts.map((a, i) => (<div key={i} className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${SEVERITY_STYLES[a.severity]}`}><span className="font-bold text-xs mt-0.5 whitespace-nowrap">{SEVERITY_LABEL[a.severity]}</span><div className="flex-1 min-w-0"><span className="font-semibold">{TYPE_LABEL[a.type] ?? a.type}</span>{' · '}<span className="font-medium">{a.employeeName}</span><p className="text-xs opacity-70 truncate mt-0.5">{a.detail}</p></div></div>))}</div><div className="mt-4 pt-4 border-t border-gray-50"><Pagination page={alertPage} pageSize={PAGE_SIZE} totalItems={sortedAlerts.length} onPageChange={setAlertPage} onPageSizeChange={() => {}} /></div></>
          )}
        </Section>

        <Section title="📈 Rendimiento" actions={<SortSelect value={perfSort} onChange={v => setPerfSort(v)} options={[{ value: 'tasksCompleted_desc', label: 'Tareas' }, { value: 'totalWorkedHours_desc', label: 'Horas' }]} />}>
          {loading.performance ? <LoadingSkeleton /> : sortedPerformance.length === 0 ? <EmptyState message="Sin datos." /> : (
            <><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100"><th className="pb-3 pr-4">Empleado</th><th className="pb-3 pr-4 text-right">Tareas</th><th className="pb-3 pr-4 text-right">Promedio</th><th className="pb-3 pr-4 text-right">Horas</th><th className="pb-3 text-right">No hechas</th></tr></thead><tbody className="divide-y divide-gray-50">{sortedPerformance.map(p => (<tr key={p.employeeId} className="hover:bg-gray-50 transition-colors"><td className="py-3 pr-4 font-medium">{p.employeeName}</td><td className="py-3 pr-4 text-right text-green-600 font-bold">{p.tasksCompleted}</td><td className="py-3 pr-4 text-right text-gray-600">{fmt(p.avgCompletionMinutes)}</td><td className="py-3 pr-4 text-right text-gray-600">{p.totalWorkedHours}h</td><td className="py-3 text-right">{p.notDoneCount > 0 ? <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">{p.notDoneCount}</span> : <span className="text-gray-300 text-xs">0</span>}</td></tr>))}</tbody></table></div><div className="mt-4 pt-4 border-t border-gray-50"><Pagination page={perfPage} pageSize={PERF_LIMIT} totalItems={perfTotal} onPageChange={handlePerfPageChange} onPageSizeChange={() => {}} /></div></>
          )}
        </Section>
      </div>
    </DashboardLayout>
  )
}

function Section({ title, badge, actions, children }: { title: string; badge?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (<div className="bg-white rounded-[var(--radius-xl)] border border-gray-100 shadow-sm p-5"><div className="flex items-center justify-between gap-3 mb-5"><div className="flex items-center gap-3 min-w-0"><h2 className="font-titles text-base font-bold text-gray-900 truncate">{title}</h2>{badge && <span className="shrink-0 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">{badge}</span>}</div>{actions && <div className="shrink-0">{actions}</div>}</div>{children}</div>)
}
function KpiCard({ icon, label, value, accent = 'bg-white border-gray-100' }: { icon: string; label: string; value: number | string; accent?: string }) {
  return (<div className={`rounded-[var(--radius-xl)] border p-5 shadow-sm ${accent}`}><div className="flex items-center gap-2 mb-2"><span className="text-xl">{icon}</span><span className="text-xs text-gray-400 font-bold uppercase tracking-wide">{label}</span></div><div className="text-3xl font-extrabold text-gray-900">{value}</div></div>)
}
function SortSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (<select value={value} onChange={e => onChange(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600 bg-white hover:border-gray-300 focus:outline-none cursor-pointer">{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>)
}
function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (<div className="animate-pulse space-y-2">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>)
}
function EmptyState({ message }: { message: string }) {
  return <div className="py-8 text-center text-gray-400 text-sm">{message}</div>
}
