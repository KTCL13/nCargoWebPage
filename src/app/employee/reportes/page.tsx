'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useReports } from '@/lib/employee/reportes/useReports'
import { HoursChart } from '@/components/employee/reportes/HoursChart'
import { TasksChart } from '@/components/employee/reportes/TasksChart'
import { ProductivityProgress } from '@/components/employee/reportes/ProductivityProgress'
import { AttendanceHistoryTable } from '@/components/employee/reportes/AttendanceHistoryTable'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

export default function ReportesPage() {
  const {
    records, loading, loadData, hoursPerDay, totalAccumulated, taskCounts
  } = useReports()

  return (
    <DashboardLayout
      pageTitle="Reportes y Analítica"
      navItems={NAV_ITEMS}
      onReload={loadData}
    >
      <h2 className="font-titles text-2xl font-extrabold text-[var(--color-nc-dark)]">
        Reportes y Analítica
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-5">
        <HoursChart hoursPerDay={hoursPerDay} loading={loading} />
        <TasksChart taskCounts={taskCounts} loading={loading} />
        <ProductivityProgress hoursPerDay={hoursPerDay} loading={loading} />
      </div>

      <AttendanceHistoryTable
        records={records}
        loading={loading}
        totalAccumulated={totalAccumulated}
      />
    </DashboardLayout>
  )
}
