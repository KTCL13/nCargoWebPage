'use client'
import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/api-client/auth-fetch'

export function useOdooSearch() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (query.length < 3) {
      setCustomers([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      setError('')
      try {
        const res = await authFetch(`/api/odoo/customers?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (!res.ok) {
          setError(data?.message || 'Error al buscar clientes')
          setCustomers([])
        } else {
          setCustomers(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        setError('Error al buscar clientes')
      } finally {
        setIsSearching(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [query])

  return { query, setQuery, isSearching, customers, setCustomers, error, setError }
}
