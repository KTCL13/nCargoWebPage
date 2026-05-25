'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend } from 'recharts'

export default function LazyPieChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
      <PieChart>
        <Pie data={data} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <ReTooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
