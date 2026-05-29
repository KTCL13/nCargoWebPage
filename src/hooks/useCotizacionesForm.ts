'use client'
import { useState } from 'react'
import { Country, Dimensions } from '@/types/cotizaciones'

export function useCotizacionesForm() {
  const [country, setCountry] = useState<Country>('CO')
  const [dept, setDept] = useState('')
  const [cityId, setCityId] = useState('')
  const [weight, setWeight] = useState('')
  const [dims, setDims] = useState<Dimensions>({ h: '', w: '', l: '' })
  const [valor, setValor] = useState('')
  const [millas, setMillas] = useState('0')
  
  const parse = (v: string) => parseFloat(v.replace(',', '.')) || 0
  const volWeight = Math.ceil((parse(dims.h) * parse(dims.w) * parse(dims.l)) / 153)

  const isValid = (flatRateEnabled: boolean) =>
    !!weight && !!dims.h && !!dims.w && !!dims.l &&
    (flatRateEnabled || !!cityId)

  return {
    country, setCountry,
    dept, setDept,
    cityId, setCityId,
    weight, setWeight,
    dims, setDims,
    valor, setValor,
    millas, setMillas,
    parse, volWeight, isValid
  }
}
