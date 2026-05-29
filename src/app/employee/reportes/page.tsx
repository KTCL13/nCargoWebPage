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

function formatCurrency(value: number) {
  return value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatDuration(hours: number) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function ReportesPage() {
  const {
    records, loading, loadData,
    from, to, pendingFrom, pendingTo,
    setPendingFrom, setPendingTo, applyDateRange,
    hoursPerDay, totalAccumulated, taskCounts,
    salaryBalance, exportCsv,
  } = useReports()

  return (
    <DashboardLayout
      pageTitle="Reportes y Analítica"
      navItems={NAV_ITEMS}
      onReload={loadData}
    >
      {/* Header row: title + date range picker */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <h2 className="font-titles text-2xl font-extrabold text-[var(--color-nc-dark)]">
          Reportes y Analítica
        </h2>

        {/* Date range controls */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-subtitles text-[var(--color-nc-dark)]/50">Desde</label>
            <input
              type="date"
              value={pendingFrom}
              max={pendingTo}
              onChange={e => setPendingFrom(e.target.value)}
              className="text-xs font-subtitles px-2.5 py-1.5 rounded-lg border border-gray-200 focus:border-[var(--color-nc-red)] outline-none bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-subtitles text-[var(--color-nc-dark)]/50">Hasta</label>
            <input
              type="date"
              value={pendingTo}
              min={pendingFrom}
              onChange={e => setPendingTo(e.target.value)}
              className="text-xs font-subtitles px-2.5 py-1.5 rounded-lg border border-gray-200 focus:border-[var(--color-nc-red)] outline-none bg-white"
            />
          </div>
          <button
            onClick={applyDateRange}
            className="px-4 py-1.5 text-xs font-subtitles font-semibold rounded-lg bg-[var(--color-nc-red)] text-white hover:bg-[var(--color-nc-red)]/90 transition"
          >
            Aplicar
          </button>
        </div>
      </div>

      {/* Charts row + personal summary card */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-5">
        <HoursChart hoursPerDay={hoursPerDay} loading={loading} />
        <TasksChart taskCounts={taskCounts} loading={loading} />
        <ProductivityProgress hoursPerDay={hoursPerDay} loading={loading} />
      </div>

      {/* Personal report summary — top right of the section */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Salary balance card */}
        <div className="lg:ml-auto w-full lg:w-auto min-w-[280px] bg-gradient-to-br from-[var(--color-nc-dark)] to-[#1a1a2e] rounded-2xl shadow-sm p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-subtitles font-semibold text-sm">Resumen del Periodo</p>
              <p className="font-subtitles text-xs text-white/50">
                {from} — {to}
              </p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[var(--color-nc-red)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-white/50 font-subtitles">Total horas</p>
              <p className="font-titles font-bold text-lg text-white">
                {loading ? '…' : formatDuration(salaryBalance.totalHours)}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-white/50 font-subtitles">Horas extras</p>
              <p className="font-titles font-bold text-lg text-[var(--color-nc-red)]">
                {loading ? '…' : formatDuration(salaryBalance.overtimeHours)}
              </p>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-white/50 font-subtitles mb-0.5">Saldo estimado</p>
            {loading ? (
              <p className="font-titles font-bold text-xl text-white">…</p>
            ) : salaryBalance.estimatedGross !== null ? (
              <>
                <p className="font-titles font-bold text-xl text-white">
                  $ {formatCurrency(salaryBalance.estimatedGross)}
                </p>
                <p className="text-xs text-white/40 font-subtitles mt-0.5">
                  {salaryBalance.regularHours.toFixed(1)}h × ${formatCurrency(salaryBalance.hourlyRate)}/h
                  {salaryBalance.overtimeHours > 0 && (
                    <> + {salaryBalance.overtimeHours.toFixed(1)}h extras ×{salaryBalance.overtimeMultiplier}</>
                  )}
                </p>
              </>
            ) : (
              <p className="text-sm text-white/60 font-subtitles">Cargo mensual fijo</p>
            )}
          </div>
        </div>
      </div>

      <AttendanceHistoryTable
        records={records}
        loading={loading}
        totalAccumulated={totalAccumulated}
        onExport={exportCsv}
      />
    </DashboardLayout>
  )
}
