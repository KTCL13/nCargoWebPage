import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useOdooSearch } from '@/hooks/useOdooSearch'
import { useOdooSubmit } from '@/hooks/useOdooSubmit'
import { useCitiesAndOffices } from '@/hooks/useCitiesAndOffices'
import { useCotizacionesForm } from '@/hooks/useCotizacionesForm'
import { useCotizacionesCalc } from '@/hooks/useCotizacionesCalc'

export function useCotizaciones() {
  const { user } = useAuth()
  
  const form = useCotizacionesForm()
  const data = useCitiesAndOffices(form.country, form.dept)
  const calc = useCotizacionesCalc(form.parse)
  
  const odooSearch = useOdooSearch()
  const odooSubmit = useOdooSubmit()

  const [isOdooModalOpen, setIsOdooModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)

  const handleCalc = useCallback(async () => {
    if (!form.isValid(data.flatRate.enabled)) {
      calc.setError('Completa peso, dimensiones, valor declarado' + (!data.flatRate.enabled ? ' y ciudad' : ''))
      return
    }
    await calc.calculate({
      country: form.country, weight: form.weight, dims: form.dims, valor: form.valor,
      millas: form.millas, cityId: form.cityId, flatRateEnabled: data.flatRate.enabled, employeeId: user?.id
    })
  }, [form, data.flatRate.enabled, calc, user])

  const handleSendToOdoo = useCallback(async () => {
    if (!selectedCustomer || !calc.result) return
    const success = await odooSubmit.sendToOdoo({
      customerId: selectedCustomer.id, result: calc.result, country: form.country, quotationId: calc.quotationId
    })
    if (success) {
      setTimeout(() => {
        setIsOdooModalOpen(false)
        odooSubmit.setSuccess('')
        setSelectedCustomer(null)
        odooSearch.setQuery('')
      }, 2500)
    }
  }, [selectedCustomer, calc.result, calc.quotationId, form.country, odooSubmit, odooSearch])

  return {
    ...form, ...data, ...calc, handleCalc,
    // Odoo
    isOdooModalOpen, setIsOdooModalOpen,
    odooSearchQuery: odooSearch.query, setOdooSearchQuery: odooSearch.setQuery,
    isSearchingOdoo: odooSearch.isSearching, odooCustomers: odooSearch.customers,
    selectedCustomer, setSelectedCustomer,
    isSendingToOdoo: odooSubmit.isSending, odooError: odooSearch.error || odooSubmit.error,
    odooSuccess: odooSubmit.success, handleSendToOdoo
  }
}
