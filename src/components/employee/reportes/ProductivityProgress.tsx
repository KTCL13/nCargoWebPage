const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const TARGET_HOURS = 8

interface ProductivityProgressProps {
  hoursPerDay: number[]
  loading: boolean
}

export function ProductivityProgress({ hoursPerDay, loading }: ProductivityProgressProps) {
  return (
    <div className="bg-[var(--color-nc-dark)] rounded-2xl shadow-sm p-5">
      <p className="font-subtitles font-semibold text-sm text-white">Productividad Semanal</p>
      <p className="font-subtitles text-xs text-white/50 mb-4">Rendimiento por día (meta: {TARGET_HOURS}h)</p>
      <div className="flex flex-col gap-2.5">
        {WEEK_DAYS.map((day, i) => {
          const pct = Math.min(Math.round((hoursPerDay[i] / TARGET_HOURS) * 100), 100)
          return (
            <div key={day}>
              <div className="flex justify-between text-xs font-subtitles text-white/70 mb-1">
                <span>{day}</span>
                <span>{loading ? '…' : `${pct}%`}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-nc-red)] to-pink-400 transition-all duration-500"
                  style={{ width: loading ? '0%' : `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
