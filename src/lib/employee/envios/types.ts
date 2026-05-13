export type Shipment = {
  id: number
  odooTaskId?: number
  odooTaskName?: string
  odooProjectName?: string
  odooCustomerName?: string
  odooStageName?: string
  trackingNumber?: string
  createdAt: string
  status?: { name: string }
}

export interface RowFeedback {
  id: number
  msg: string
  ok: boolean
}
