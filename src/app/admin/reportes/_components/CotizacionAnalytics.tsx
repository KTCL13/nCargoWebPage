'use client'

import type { CotizacionAnalyticsData } from '@/lib/admin/reports/useCotizacionAnalytics'

function usd(v: number) {
  return `$${v.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function KpiCard({ icon, label, value, sub, accent = '' }: { icon: string; label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className={`rounded-[var(--radius-lg)] border border-gray-100 bg-white shadow-sm p-4 flex flex-col gap-1 ${accent}`}>
      <div className="text-xl">{icon}</div>
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-extrabold text-[var(--color-foreground)]">{value}</div>
      {sub && <div className="text-[11px] text-gray-400">{sub}</div>}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-gray-100 bg-white shadow-sm p-5">
      <h3 className="font-titles font-bold text-sm text-[var(--color-foreground)] mb-4">{title}</h3>
      {children}
    </div>
  )
}

function LoadingBar() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  )
}

const COST_LABELS: Record<string, string> = {
  transport: 'Transporte',
  customs: 'Aduana',
  insurance: 'Seguro',
  pickup: 'Recogida',
  cityDelivery: 'Entrega ciudad',
  volumetricSurcharge: 'Recargo volumétrico',
}

const COST_COLORS: Record<string, string> = {
  transport: 'bg-blue-500',
  customs: 'bg-orange-500',
  insurance: 'bg-purple-500',
  pickup: 'bg-green-500',
  cityDelivery: 'bg-cyan-500',
  volumetricSurcharge: 'bg-yellow-400',
}

type CotizacionAnalyticsProps = {
  data: CotizacionAnalyticsData | null
  loading: boolean
  error: string | null
}

export default function CotizacionAnalytics({ data, loading, error }: CotizacionAnalyticsProps) {
  if (error) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-red-100 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    )
  }

  const s = data?.summary
  const cb = data?.costBreakdown
  const costEntries = cb
    ? (Object.entries(cb) as [string, { total: number; pct: number }][]).sort((a, b) => b[1].total - a[1].total)
    : []

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          icon="💰"
          label="Ingresos totales"
          value={loading || !s ? '—' : usd(s.totalRevenue)}
          accent="bg-emerald-50 border-emerald-100"
        />
        <KpiCard
          icon="📋"
          label="Cotizaciones"
          value={loading || !s ? '—' : s.totalQuotations}
          sub="total registradas"
        />
        <KpiCard
          icon="✈️"
          label="Enviadas a Odoo"
          value={loading || !s ? '—' : s.sentToOdoo}
          sub="cotizaciones pagadas"
          accent="bg-blue-50 border-blue-100"
        />
        <KpiCard
          icon="💵"
          label="Ticket promedio"
          value={loading || !s ? '—' : usd(s.avgTicket)}
        />
        <KpiCard
          icon="🇨🇴"
          label="Colombia"
          value={loading || !s ? '—' : s.byCO}
          sub="cotizaciones CO"
        />
        <KpiCard
          icon="🇲🇽"
          label="México"
          value={loading || !s ? '—' : s.byMX}
          sub="cotizaciones MX"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desglose de costos */}
        <SectionCard title="💸 Desglose de costos (qué paga más el cliente)">
          {loading ? (
            <LoadingBar />
          ) : costEntries.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos.</p>
          ) : (
            <div className="space-y-3">
              {costEntries.map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{COST_LABELS[key] ?? key}</span>
                    <span className="text-gray-500">
                      {usd(val.total)} &nbsp;·&nbsp; <span className="font-bold text-gray-700">{val.pct}%</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${COST_COLORS[key] ?? 'bg-gray-400'}`}
                      style={{ width: `${Math.min(val.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Top empleados por cotizaciones enviadas a Odoo */}
        <SectionCard title="🏆 Empleados con más cotizaciones enviadas a Odoo">
          {loading ? (
            <LoadingBar />
          ) : !data?.topEmployees.length ? (
            <p className="text-sm text-gray-400">Sin cotizaciones enviadas a Odoo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left py-2 pr-3 font-bold uppercase tracking-wide">#</th>
                    <th className="text-left py-2 pr-3 font-bold uppercase tracking-wide">Empleado</th>
                    <th className="text-right py-2 pr-3 font-bold uppercase tracking-wide">Cotizaciones</th>
                    <th className="text-right py-2 font-bold uppercase tracking-wide">Valor total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topEmployees.map((emp, i) => (
                    <tr key={emp.employeeId} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="py-2 pr-3 text-gray-400">{i + 1}</td>
                      <td className="py-2 pr-3 font-medium text-gray-800">{emp.employeeName}</td>
                      <td className="py-2 pr-3 text-right tabular-nums font-bold text-blue-600">{emp.quotationsSent}</td>
                      <td className="py-2 text-right tabular-nums text-emerald-700 font-medium">{usd(emp.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patrones de paquetes */}
        <SectionCard title="📦 Patrones por tamaño de paquete">
          {loading ? (
            <LoadingBar />
          ) : !data?.packagePatterns.length ? (
            <p className="text-sm text-gray-400">Sin datos.</p>
          ) : (
            <div className="space-y-4">
              {data.packagePatterns.map(p => (
                <div key={p.label} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-700">{p.label}</span>
                    <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 rounded px-2 py-0.5">
                      {p.count} paquetes · {p.pct}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div>
                      <div className="font-bold text-green-600">{p.withPickup}</div>
                      <div className="text-gray-400">Con recogida</div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-600">{p.withoutPickup}</div>
                      <div className="text-gray-400">Sin recogida</div>
                    </div>
                    <div>
                      <div className="font-bold text-blue-600">{usd(p.avgTotal)}</div>
                      <div className="text-gray-400">Precio prom.</div>
                    </div>
                  </div>
                  {p.count > 0 && (
                    <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-400"
                        style={{ width: `${p.count > 0 ? (p.withPickup / p.count) * 100 : 0}%` }}
                      />
                    </div>
                  )}
                  {p.count > 0 && (
                    <div className="text-[10px] text-gray-400 mt-1">
                      {p.count > 0 ? Math.round((p.withPickup / p.count) * 100) : 0}% usan recogida
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Top destinos */}
        <SectionCard title="📍 Top destinos por ingresos">
          {loading ? (
            <LoadingBar />
          ) : !data?.topDestinations.length ? (
            <p className="text-sm text-gray-400">Sin datos de destinos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left py-2 pr-2 font-bold uppercase tracking-wide">Ciudad</th>
                    <th className="text-right py-2 pr-2 font-bold uppercase tracking-wide">Envíos</th>
                    <th className="text-right py-2 pr-2 font-bold uppercase tracking-wide">Ingresos</th>
                    <th className="text-right py-2 font-bold uppercase tracking-wide">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topDestinations.map((dest, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="py-2 pr-2">
                        <div className="font-medium text-gray-800">{dest.city}</div>
                        {dest.department && <div className="text-gray-400">{dest.department}</div>}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums text-gray-700">{dest.count}</td>
                      <td className="py-2 pr-2 text-right tabular-nums font-bold text-emerald-700">{usd(dest.totalRevenue)}</td>
                      <td className="py-2 text-right tabular-nums text-gray-500">{usd(dest.avgTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
