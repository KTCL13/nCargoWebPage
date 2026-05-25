'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function LazyBarChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: '#f9fafb' }} />
        <Legend />
        <Bar dataKey="completadas" name="Tareas" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="horas" name="Horas" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
