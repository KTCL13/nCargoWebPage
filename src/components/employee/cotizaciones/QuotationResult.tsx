import { Breakdown } from '@/lib/employee/cotizaciones/types'

interface QuotationResultProps {
  result: Breakdown
}

export function QuotationResult({ result }: QuotationResultProps) {
  return (
    <div className="bg-[var(--color-nc-dark)] rounded-2xl px-6 py-5">
      <p className="font-subtitles text-xs text-white/50 uppercase tracking-wide mb-1 text-center">Total de la cotización</p>
      <p className="font-titles text-4xl font-extrabold text-white text-center">
        <small className="text-base font-normal text-white/60">USD </small>{result.total.toFixed(2)}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-subtitles text-white/60">
        <span>Transporte</span>          <span className="text-right text-white/80">USD {result.transport.toFixed(2)}</span>
        <span>Recargo volumétrico</span>  <span className="text-right text-white/80">USD {result.volumetricSurcharge.toFixed(2)}</span>
        <span>Seguro</span>               <span className="text-right text-white/80">USD {result.insurance.toFixed(2)}</span>
        <span>Aduana</span>               <span className="text-right text-white/80">USD {result.customs.toFixed(2)}</span>
        <span>Entrega ciudad</span>       <span className="text-right text-white/80">USD {result.cityDelivery.toFixed(2)}</span>
        <span>Recogida</span>             <span className="text-right text-white/80">USD {result.pickup.toFixed(2)}</span>
      </div>
      {result.detail.cityName && (
        <p className="font-subtitles text-[10px] text-white/40 mt-3 text-center">
          Ciudad: {result.detail.cityName}{result.detail.flatRateApplied ? ' (tarifa plana)' : ''}
        </p>
      )}
      <p className="font-subtitles text-[10px] text-white/30 mt-1 text-center">
        *Estimado. Aduana puede aplicar cargos adicionales.
      </p>
    </div>
  )
}
