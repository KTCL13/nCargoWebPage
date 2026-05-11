import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

export type TimePoint = {
  date: string
  workedHours: number
  tasksCompleted: number
  productivityScore: number | null
}

const CHART_H = 210

const baseTip = {
  borderRadius: '10px',
  border: '1px solid rgba(0,0,0,0.08)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontFamily: 'inherit',
  fontSize: '12px',
  padding: '8px 12px',
}

const darkTip = {
  ...baseTip,
  backgroundColor: '#0d1340',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
}

const tickStyle = { fontSize: 11, fill: '#94a3b8' }
const darkTickStyle = { fontSize: 11, fill: 'rgba(255,255,255,0.35)' }

export function Charts({ timeSeries }: { timeSeries: TimePoint[] }) {
  const data = timeSeries.length > 0 ? timeSeries : [{ date: '—', workedHours: 0, tasksCompleted: 0, productivityScore: null }]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

      {/* Horas trabajadas — area */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 relative">
        <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)]">Horas trabajadas</p>
        <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/40 mb-4">Acumulado por día</p>
        <ResponsiveContainer width="100%" height={CHART_H} minWidth={0} minHeight={0} debounce={50}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="kpiHoursGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0C1E8C" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#0C1E8C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
            <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} />
            <YAxis tick={tickStyle} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={baseTip}
              formatter={(v) => [`${Number(v).toFixed(1)}h`, 'Horas']}
            />
            <Area
              type="monotone"
              dataKey="workedHours"
              stroke="#0C1E8C"
              fill="url(#kpiHoursGrad)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tareas completadas — bars */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 relative">
        <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)]">Tareas completadas</p>
        <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/40 mb-4">Por día</p>
        <ResponsiveContainer width="100%" height={CHART_H} minWidth={0} minHeight={0} debounce={50}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
            <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} />
            <YAxis tick={tickStyle} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={baseTip}
              formatter={(v) => [String(v), 'Tareas']}
            />
            <Bar
              dataKey="tasksCompleted"
              fill="#FF003B"
              radius={[5, 5, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Productividad — dark card line */}
      <div className="bg-[var(--color-nc-dark)] rounded-2xl shadow-sm p-5 relative">
        <p className="font-subtitles font-semibold text-sm text-white">Productividad</p>
        <p className="font-subtitles text-xs text-white/40 mb-4">Score promedio por día</p>
        <ResponsiveContainer width="100%" height={CHART_H} minWidth={0} minHeight={0} debounce={50}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="kpiProdGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis dataKey="date" tick={darkTickStyle} tickLine={false} axisLine={false} />
            <YAxis tick={darkTickStyle} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={darkTip}
              formatter={(v) => [v != null ? `${Number(v).toFixed(1)}%` : '—', 'Score']}
            />
            <Line
              type="monotone"
              dataKey="productivityScore"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
