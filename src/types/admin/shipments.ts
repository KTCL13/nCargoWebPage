export type Locker = {
  id: number
  odooProjectId: number
  odooProjectName: string
  customerName: string | null
  lastSyncedAt: string | null
  _count: { shipments: number }
}

export type Envio = {
  id: number
  odooTaskId: number | null
  odooTaskName: string | null
  odooProjectName: string | null
  odooCustomerName: string | null
  odooStageName: string | null
  trackingNumber: string | null
  createdAt: string
}

export const STAGES = ['Pendiente', 'En proceso', 'Entregado', 'Cancelado'] as const
export type Stage = typeof STAGES[number]

export const STAGE_STYLE: Record<string, string> = {
  'Pendiente':  'bg-amber-100 text-amber-800',
  'En proceso': 'bg-blue-100 text-blue-800',
  'Entregado':  'bg-green-100 text-green-800',
  'Cancelado':  'bg-red-100 text-red-600',
}
