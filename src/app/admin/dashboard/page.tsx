'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'

type Employee = {
  id: number
  name: string
  email: string
  status: 'ACTIVE' | 'INACTIVE'
  roles: string[]
  activeContract: { id: number; job: { title: string } } | null
}

type WorkloadEntry = {
  employeeId: number
  employeeName: string
  totalTasks: number
  inProgressCount: number
  completedCount: number
}

type PerformanceEntry = {
  employeeId: number
  employeeName: string
  tasksCompleted: number
  totalWorkedHours: number
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function DashboardPage() {
  const router = useRouter()

  const [activeCount, setActiveCount] = useState<number | null>(null)
  const [inProgressTasks, setInProgressTasks] = useState<number | null>(null)
  const [todayAttendances, setTodayAttendances] = useState<number | null>(null)
  const [totalQuotations, setTotalQuotations] = useState<number | null>(null)
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([])
  const [performance, setPerformance] = useState<PerformanceEntry[]>([])

  const fetchAll = useCallback(async () => {
    const [empRes, workloadRes, attendanceRes, quotationsRes, perfRes] = await Promise.allSettled([
      fetch('/api/employees?status=ACTIVE&limit=1').then(r => r.json()),
      fetch('/api/analytics/workload').then(r => r.json()),
      fetch('/api/attendance?page=1&pageSize=1').then(r => r.json()),
      fetch('/api/quotations?page=1&limit=1').then(r => r.json()),
      fetch('/api/analytics/employee-performance').then(r => r.json()),
    ])

    if (empRes.status === 'fulfilled') setActiveCount(empRes.value.total ?? 0)
    if (workloadRes.status === 'fulfilled' && Array.isArray(workloadRes.value)) {
      const sum = (workloadRes.value as WorkloadEntry[]).reduce((acc, e) => acc + e.inProgressCount, 0)
      setInProgressTasks(sum)
    }
    if (attendanceRes.status === 'fulfilled') setTodayAttendances(attendanceRes.value.total ?? 0)
    if (quotationsRes.status === 'fulfilled') setTotalQuotations(quotationsRes.value.total ?? 0)
    if (perfRes.status === 'fulfilled' && Array.isArray(perfRes.value)) {
      setPerformance((perfRes.value as PerformanceEntry[]).slice(0, 5))
    }

    // Fetch recent employees for the table (separate call with limit=4)
    try {
      const empList = await fetch('/api/employees?page=1&limit=4').then(r => r.json())
      setRecentEmployees(empList.data ?? [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const navigateTo = (path: string) => router.push(`/admin/${path}`)

  const maxTasks = Math.max(...performance.map(p => p.tasksCompleted), 1)

  return (
    <DashboardLayout
      pageTitle="Dashboard"
      navItems={NAV_ITEMS}
      onReload={fetchAll}
    >
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-2">
              Panel de Control
            </div>
            <h1 className="font-titles text-3xl font-extrabold text-[var(--color-foreground)]">
              Bienvenido, <span className="text-[var(--color-primary)]">Admin</span> 👋
            </h1>
            <p className="text-gray-500 text-sm">Resumen general de operaciones NCargo USA</p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-500 px-4 py-2 rounded-full text-xs font-medium self-start">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Sistema activo
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--color-foreground)] text-white p-6 rounded-[var(--radius-xl)] shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Empleados activos</span>
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-4xl font-extrabold mb-1">{activeCount === null ? '—' : activeCount}</div>
            <div className="text-green-400 text-xs font-medium">↑ Datos actualizados</div>
          </div>

          <div className="bg-white p-6 rounded-[var(--radius-xl)] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Tareas en proceso</span>
              <span className="text-2xl">⚡</span>
            </div>
            <div className="text-4xl font-extrabold text-gray-900 mb-1">
              {inProgressTasks === null ? '—' : inProgressTasks}
            </div>
            <div className="text-orange-500 text-xs font-medium">Carga actual del equipo</div>
          </div>

          <div className="bg-white p-6 rounded-[var(--radius-xl)] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Jornadas registradas</span>
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="text-4xl font-extrabold text-gray-900 mb-1">
              {todayAttendances === null ? '—' : todayAttendances}
            </div>
            <div className="text-green-500 text-xs font-medium">Total en el sistema</div>
          </div>

          <div className="bg-white p-6 rounded-[var(--radius-xl)] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Cotizaciones</span>
              <span className="text-2xl">📦</span>
            </div>
            <div className="text-4xl font-extrabold text-gray-900 mb-1">
              {totalQuotations === null ? '—' : totalQuotations}
            </div>
            <div className="text-green-500 text-xs font-medium">Total registradas</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-titles text-lg font-bold mb-4">Gestión Estratégica</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <QuickActionCard icon="👤" color="#FEE2E2" label="Empleados" sub="Altas/Bajas" onClick={() => navigateTo('empleados')} />
            <QuickActionCard icon="⏱️" color="#DCFCE7" label="Asistencia" sub="Control Horas" onClick={() => navigateTo('asistencia')} />
            <QuickActionCard icon="📝" color="#DBEAFE" label="Contratos" sub="Cargos/Tarifas" onClick={() => navigateTo('contratos')} />
            <QuickActionCard icon="📋" color="#E0E7FF" label="Gestión Tareas" sub="Asignación" onClick={() => navigateTo('tasks')} />
            <QuickActionCard icon="📊" color="#FEF3C7" label="Analítica" sub="Ver KPIs" onClick={() => navigateTo('reportes')} />
            <QuickActionCard icon="📂" color="#F3E8FF" label="Expedientes" sub="Docs" onClick={() => navigateTo('expedientes')} />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Employees */}
          <div className="bg-white rounded-[var(--radius-xl)] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold">Empleados Recientes</h3>
              <button onClick={() => navigateTo('empleados')} className="text-blue-600 text-xs font-semibold hover:underline">
                Ver todos
              </button>
            </div>
            <div className="p-2">
              {recentEmployees.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">Sin datos</p>
              ) : (
                recentEmployees.map(emp => (
                  <EmployeeRow
                    key={emp.id}
                    name={emp.name}
                    role={emp.activeContract?.job.title ?? emp.roles[0] ?? 'Sin cargo'}
                    initials={initials(emp.name)}
                    status={emp.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    statusColor={emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
                  />
                ))
              )}
            </div>
          </div>

          {/* Productivity Bars */}
          <div className="bg-white rounded-[var(--radius-xl)] border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold mb-6">Productividad del equipo</h3>
            {performance.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">Sin datos de rendimiento</p>
            ) : (
              <div className="space-y-5">
                {performance.map(p => (
                  <ProgressBar
                    key={p.employeeId}
                    label={p.employeeName}
                    value={Math.round((p.tasksCompleted / maxTasks) * 100)}
                    color="bg-blue-600"
                    detail={`${p.tasksCompleted} tareas · ${p.totalWorkedHours}h`}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}

function QuickActionCard({ icon, label, sub, color, onClick }: { icon: string; label: string; sub: string; color: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="font-bold text-sm text-gray-800">{label}</div>
      <div className="text-[10px] text-gray-400 font-mono mt-1">{sub}</div>
    </div>
  )
}

function EmployeeRow({ name, role, initials, status, statusColor }: { name: string; role: string; initials: string; status: string; statusColor: string }) {
  return (
    <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-900 truncate">{name}</div>
        <div className="text-xs text-gray-500 truncate">{role}</div>
      </div>
      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${statusColor}`}>{status}</span>
    </div>
  )
}

function ProgressBar({ label, value, color, detail }: { label: string; value: number; color: string; detail?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-bold text-gray-600 text-[10px]">{detail ?? `${value}%`}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  )
}
