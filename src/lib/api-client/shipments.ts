export const shipmentsClient = {
  async updateShipment(token: string | null, data: { id: number, trackingNumber?: string, odooStageName?: string, comment?: string }) {
    const res = await fetch('/api/shipments', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    })
    
    if (!res.ok) {
      throw new Error('Error updating shipment')
    }
    return res.json()
  },
  
  async createShipmentForLocker(token: string | null, lockerId: number, data: { name: string, description?: string }) {
    const res = await fetch(`/api/lockers/${lockerId}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    })
    
    if (!res.ok) {
      throw new Error('Error creating shipment')
    }
    return res.json()
  }
}
