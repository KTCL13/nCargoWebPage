export type Rate = {
  id: number
  destination: { id: number; city: string; region: string | null; regionId: number | null; country: string }
  basePrice: number
}
export type Location = { id: number; city: string; region: string | null; country: string }
export type Country = { id: number; name: string; code: string }
export type ConfigEntry = { key: string; value: unknown; description: string | null }

export const CONFIG_LABELS: Record<string, string> = {
  divisor:               'Divisor peso volumétrico (in³/lb)',
  insurance_rate:        'Tasa seguro (ej. 0.10 = 10%)',
  customs_rate:          'Arancel aduanal >$200 (ej. 0.31)',
  customs_threshold:     'Umbral aduanas (USD)',
  pickup_base:           'Costo base recogida (USD)',
  pickup_per_extra_mile: 'Costo por milla extra (USD)',
  pickup_free_miles:     'Millas incluidas en base',
}

export const FLAT_RATE_KEYS = new Set([
  'co_flat_rate_enabled', 'co_flat_rate_price',
  'mx_flat_rate_enabled', 'mx_flat_rate_price',
])

export const CONTRACT_CONFIG_KEYS = [
  { key: 'smlv',                   label: 'SMLV – Salario Mínimo Legal Vigente (USD)',   hint: 'Salario mensual mínimo legal en dólares estadounidenses (USD). Los contratos no pueden tener un salario inferior a este valor.',  step: '1',    prefix: '$', isMoney: true  },
  { key: 'min_hourly_rate',        label: 'Tarifa mínima por hora (USD)',                hint: 'Valor mínimo permitido para la tarifa horaria en cualquier contrato, expresado en dólares estadounidenses (USD).',                step: '0.01', prefix: '$', isMoney: true  },
  { key: 'daily_hours',            label: 'Jornada diaria legal (horas)',                hint: 'Número de horas que constituyen la jornada laboral ordinaria. Ej: 8.',                                                           step: '0.5',  prefix: '',  isMoney: false },
  { key: 'extra_hour_multiplier',  label: 'Multiplicador hora extra',                   hint: 'Factor que se aplica sobre la tarifa hora al calcular horas extras. Ej: 1.5.',                                                    step: '0.01', prefix: '',  isMoney: false },
]
