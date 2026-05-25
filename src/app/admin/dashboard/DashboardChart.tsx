'use client'

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardChart({ pieData }: { pieData: any[] }) {
  if (pieData.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-6">Sin datos de rendimiento</p>
  }
  
  return (
    <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={0} debounce={50}>
      <PieChart>
        <Pie data={pieData} innerRadius={65} outerRadius={100} paddingAngle={4} dataKey="value">
          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
        <Tooltip formatter={(v) => [`${v} tareas`, '']} />
        <Legend formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}
