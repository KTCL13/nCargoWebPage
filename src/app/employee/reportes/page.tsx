'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
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

const EMPLOYEE_ID = 1

interface AttendanceRecord {
  id: number
  status: 'OPEN' | 'PAUSED' | 'CLOSED'
  startedAt: string
  endedAt: string | null
  workedHours: number | null
  employee: { id: number; name: string }
  events: { type: string; timestamp: string }[]
}

function formatDuration(hours: number | null) {
  if (!hours) return '—'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function getWeekBounds() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  return monday
}

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function ReportesPage() {
  const router = useRouter()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/attendance?pageSize=0')
      .then(r => r.json())
      .then((d: { data: AttendanceRecord[] }) => {
        const emp = (d.data ?? []).filter(a => a.employee?.id === EMPLOYEE_ID)
        setRecords(emp)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const weekStart = getWeekBounds()
  const weekRecords = records.filter(a => new Date(a.startedAt) >= weekStart)

  const hoursPerDay: number[] = Array(7).fill(0)
  for (const r of weekRecords) {
    const dayIdx = (new Date(r.startedAt).getDay() + 6) % 7
    hoursPerDay[dayIdx] += Number(r.workedHours ?? 0)
  }

  const barData = {
    labels: WEEK_DAYS,
    datasets: [{
      label: 'Horas',
      data: hoursPerDay,
      backgroundColor: '#FF003B',
      borderRadius: 6,
    }],
  }
  const barOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, max: 10 } },
  }

  const doughnutData = {
    labels: ['Gestión', 'Envíos', 'Reuniones', 'Otros'],
    datasets: [{
      data: [40, 30, 20, 10],
      backgroundColor: ['#FF003B', '#0C1E8C', '#F59E0B', '#9CA3AF'],
      borderWidth: 0,
    }],
  }
  const doughnutOpts = {
    responsive: true,
    cutout: '68%',
    plugins: { legend: { position: 'bottom' as const } },
  }

  const statusBadge = (status: string) => {
    if (status === 'CLOSED') return 'bg-green-100 text-green-700'
    if (status === 'PAUSED') return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-600'
  }
  const statusLabel = (status: string) => ({
    CLOSED: 'Completada', PAUSED: 'Pausada', OPEN: 'Activa',
  }[status] ?? status)

  const maxHours = Math.max(...hoursPerDay, 1)

  return (
    <DashboardLayout
      pageTitle="Reportes y Analítica"
      navItems={NAV_ITEMS}
      onReload={() => window.location.reload()}
    >
      <h2 className="font-titles text-2xl font-extrabold text-[var(--color-nc-dark)]">
        Reportes y Analítica
      </h2>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-5">
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
          <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)]">Horas por Día</p>
          <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50 mb-4">Distribución semanal</p>
          <Bar data={barData} options={barOpts} />
        </div>

        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
          <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)]">Tiempo por Categoría</p>
          <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50 mb-4">Distribución estimada</p>
          <Doughnut data={doughnutData} options={doughnutOpts} />
        </div>

        <div className="bg-[var(--color-nc-dark)] rounded-2xl shadow-sm p-5">
          <p className="font-subtitles font-semibold text-sm text-white">Productividad Semanal</p>
          <p className="font-subtitles text-xs text-white/50 mb-4">Rendimiento por día</p>
          <div className="flex flex-col gap-2.5">
            {WEEK_DAYS.map((day, i) => {
              const pct = Math.round((hoursPerDay[i] / maxHours) * 100)
              return (
                <div key={day}>
                  <div className="flex justify-between text-xs font-subtitles text-white/70 mb-1">
                    <span>{day}</span><span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-nc-red)] to-pink-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <div>
            <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)]">Historial de Sesiones</p>
            <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50">
              Total acumulado:{' '}
              <strong className="text-[var(--color-nc-red)]">
                {formatDuration(records.reduce((s, r) => s + Number(r.workedHours ?? 0), 0))}
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
            <table className="w-full text-sm font-body">
              <thead className="bg-[#F7F8FA]">
                <tr>
                  {['Hora Inicio', 'Hora Fin', 'Tiempo Total', 'Estado'].map(h => (
                    <th key={h} className="text-left px-6 py-3 font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/50 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F7F8FA]/50'}>
                    <td className="px-6 py-3 text-[var(--color-nc-dark)]">
                      {new Date(r.startedAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-3 text-[var(--color-nc-dark)]">
                      {r.endedAt ? new Date(r.endedAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="px-6 py-3 font-semibold text-[var(--color-nc-dark)]">
                      {formatDuration(r.workedHours)}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-subtitles font-semibold ${statusBadge(r.status)}`}>
                        {statusLabel(r.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
