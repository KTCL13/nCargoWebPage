'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useAuth } from '@/context/AuthContext'
import { useEmployeeReports } from '@/lib/admin/reports/useEmployeeReports'
import { MetricCards } from './_components/MetricCards'
import { EmployeeSearch } from '@/components/ui/EmployeeSearch'
import dynamic from 'next/dynamic'

const Charts = dynamic(() => import('./_components/Charts').then(mod => mod.Charts), { ssr: false, loading: () => <div className="animate-pulse h-[300px] bg-gray-100 rounded-xl" /> })
const EmployeeTable = dynamic(() => import('./_components/EmployeeTable').then(mod => mod.EmployeeTable), { ssr: false, loading: () => <div className="animate-pulse space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div> })


export default function EmployeeReportsPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const { range, setRange, employeeFilter, setEmployeeFilter, records, loading, error, fetchData, uniqueEmployees, metrics, timeSeries, employeeRows } = useEmployeeReports(token)

  useEffect(() => { if (user && user.role !== 'ADMIN') router.replace('/admin/dashboard') }, [user, router])

  return (
    <DashboardLayout pageTitle="KPIs Empleados" navItems={NAV_ITEMS} onReload={fetchData}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h2 className="font-titles text-2xl font-extrabold">KPIs de Empleados</h2><p className="font-subtitles text-sm text-gray-400">Rendimiento del equipo</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border overflow-hidden text-sm">
            {(['7d', '30d', '90d', 'all'] as const).map(k => (
              <button key={k} onClick={() => setRange(k)} className={`px-3 py-2 transition ${range === k ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>{k === 'all' ? 'Todo' : k}</button>
            ))}
          </div>
          <EmployeeSearch
            onSelect={(emp) => setEmployeeFilter(emp ? emp.id : null)}
            placeholder="Buscar por nombre..."
            className="min-w-[240px]"
          />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mt-4">{error}</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /><p className="text-sm text-gray-400">Cargando...</p></div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4"><span className="text-5xl">📊</span><p className="font-bold text-gray-400">Sin datos para este período</p></div>
      ) : (
        <div className="space-y-6 mt-6 min-h-[600px]">
          <MetricCards metrics={metrics} />
          <Charts timeSeries={timeSeries} />
          <EmployeeTable rows={employeeRows} />
        </div>
      )}
    </DashboardLayout>
  )
}
