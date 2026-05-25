'use client'

import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useDashboard } from '@/lib/admin/dashboard/useDashboard'

const DashboardSkeleton = () => <div className="w-full h-[260px] bg-gray-50 animate-pulse rounded-[var(--radius-xl)]"></div>

const DashboardChart = dynamic(() => import('./DashboardChart'), {
  ssr: false,
  loading: () => <DashboardSkeleton />
})

export default function DashboardPage() {
  const router = useRouter()
  const {
    activeCount, inProgressTasks, todayAttendances, totalQuotations,
    recentEmployees, pieData, fetchAll
  } = useDashboard()

  const memoizedPieData = useMemo(() => pieData, [pieData])
  const memoizedRecentEmployees = useMemo(() => recentEmployees, [recentEmployees])

  const initials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const navigateTo = (path: string) => router.push(`/admin/${path}`)

  return (
    <DashboardLayout pageTitle="Dashboard" navItems={NAV_ITEMS} onReload={fetchAll}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-h-[80px]">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-2">Panel de Control</div>
            <h1 className="font-titles text-3xl font-extrabold text-[var(--color-foreground)]">Bienvenido, <span className="text-[var(--color-primary)]">Admin</span> 👋</h1>
            <p className="text-gray-600 text-sm">Resumen general de operaciones NCargo USA</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-green-500/30 text-emerald-900 px-4 py-2 rounded-full text-xs font-medium self-start">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Sistema activo
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[140px]">
          <KPICard label="Empleados activos" value={activeCount} icon="👥" sub="↑ Datos actualizados" subColor="text-green-400" dark />
          <KPICard label="Tareas en proceso" value={inProgressTasks} icon="⚡" sub="Carga actual del equipo" subColor="text-orange-700" />
          <KPICard label="Jornadas registradas" value={todayAttendances} icon="⏱️" sub="Total en el sistema" subColor="text-green-700" />
          <KPICard label="Cotizaciones" value={totalQuotations} icon="📦" sub="Total registradas" subColor="text-green-700" />
        </div>

        <div>
          <h2 className="font-titles text-lg font-bold mb-4">Gestión Estratégica</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <QuickActionCard icon="👤" color="#FEE2E2" label="Empleados" sub="Altas/Bajas" onClick={() => navigateTo('empleados')} />
            <QuickActionCard icon="⏱️" color="#DCFCE7" label="Asistencia" sub="Control Horas" onClick={() => navigateTo('asistencia')} />
            <QuickActionCard icon="📝" color="#DBEAFE" label="Contratos" sub="Cargos/Tarifas" onClick={() => navigateTo('contratos')} />
            <QuickActionCard icon="📋" color="#E0E7FF" label="Gestión Tareas" sub="Asignación" onClick={() => navigateTo('tasks')} />
            <QuickActionCard icon="📊" color="#FEF3C7" label="Analítica" sub="Ver KPIs" onClick={() => navigateTo('reportes')} />
            <QuickActionCard icon="📂" color="#F3E8FF" label="Expedientes" sub="Docs" onClick={() => navigateTo('expedientes')} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[350px]">
          <div className="bg-white rounded-[var(--radius-xl)] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center"><h2 className="font-bold">Empleados Recientes</h2><button onClick={() => navigateTo('empleados')} className="text-blue-600 text-xs font-semibold hover:underline">Ver todos</button></div>
            <div className="p-2">
              {memoizedRecentEmployees.length === 0 ? <p className="text-center text-gray-600 text-sm py-6">Sin datos</p> : memoizedRecentEmployees.map(emp => (
                <EmployeeRow key={emp.id} name={emp.name} role={emp.activeContract?.job.title ?? emp.roles[0] ?? 'Sin cargo'} initials={initials(emp.name)} status={emp.status === 'ACTIVE' ? 'Activo' : 'Inactivo'} statusColor={emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[var(--radius-xl)] border border-gray-100 shadow-sm p-5 relative">
            <h2 className="font-bold mb-4">Productividad del equipo</h2>
            <DashboardChart pieData={memoizedPieData} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function KPICard({ label, value, icon, sub, subColor, dark = false }: { label: string; value: number | null; icon: string; sub: string; subColor: string; dark?: boolean }) {
  return (
    <div className={`${dark ? 'bg-[var(--color-foreground)] text-white' : 'bg-white border-gray-100'} p-6 rounded-[var(--radius-xl)] shadow-sm relative overflow-hidden border`}>
      <div className="flex justify-between items-start mb-4"><span className={`${dark ? 'text-white/60' : 'text-gray-600'} text-xs font-bold uppercase tracking-wider`}>{label}</span><span className="text-2xl">{icon}</span></div>
      <div className="text-4xl font-extrabold mb-1">{value === null ? '—' : value}</div>
      <div className={`${subColor} text-xs font-medium`}>{sub}</div>
    </div>
  )
}

function QuickActionCard({ icon, label, sub, color, onClick }: { icon: string; label: string; sub: string; color: string; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-[opacity,transform,box-shadow] cursor-pointer group">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform" style={{ backgroundColor: color }}>{icon}</div>
      <div className="font-bold text-sm text-gray-800">{label}</div>
      <div className="text-[10px] text-gray-600 font-mono mt-1">{sub}</div>
    </div>
  )
}

function EmployeeRow({ name, role, initials, status, statusColor }: { name: string; role: string; initials: string; status: string; statusColor: string }) {
  return (
    <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
      <div className="flex-1 min-w-0"><div className="text-sm font-bold text-gray-900 truncate">{name}</div><div className="text-xs text-gray-600 truncate">{role}</div></div>
      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${statusColor}`}>{status}</span>
    </div>
  )
}
