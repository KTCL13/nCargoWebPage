'use client'
import { useState, useCallback } from 'react'
import { Breakdown, Country } from '@/types/cotizaciones'
import { authFetch } from '@/lib/api-client/auth-fetch'

export function useOdooSubmit() {
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const sendToOdoo = useCallback(async (params: { customerId: number; result: Breakdown; country: Country; quotationId: number | null }) => {
    setIsSending(true)
    setError('')
    setSuccess('')

    try {
      const res = await authFetch('/api/odoo/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: params.customerId,
          quotationData: params.result,
          country: params.country,
          quotationId: params.quotationId,
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(data.message || '¡Cotización enviada con éxito!')
        return true
      } else {
        setError(data.message || 'Error al enviar a Odoo')
        return false
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
      return false
    } finally {
      setIsSending(false)
    }
  }, [])

  return { sendToOdoo, isSending, error, setError, success, setSuccess }
}
