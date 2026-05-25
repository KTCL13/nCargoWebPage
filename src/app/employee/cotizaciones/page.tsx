'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useCotizaciones } from '@/lib/employee/cotizaciones/useCotizaciones'
import { CalculatorForm } from '@/components/employee/cotizaciones/CalculatorForm'
import { QuotationResult } from '@/components/employee/cotizaciones/QuotationResult'
import { MapPanel } from '@/components/employee/cotizaciones/MapPanel'
import { OdooModal } from '@/components/employee/cotizaciones/OdooModal'

export default function CotizacionesPage() {
  const {
    country, setCountry, departments, dept, setDept, filteredCities, cityId, setCityId,
    weight, setWeight, dims, setDims, valor, setValor, millas, setMillas, result, setResult,
    loading, error, setError, offices, origin, setOrigin, volWeight, isValid, handleCalc,
    citiesLoading, flatRate, isOdooModalOpen, setIsOdooModalOpen, odooSearchQuery,
    setOdooSearchQuery, isSearchingOdoo, odooCustomers, selectedCustomer, setSelectedCustomer,
    isSendingToOdoo, odooError, odooSuccess, handleSendToOdoo
  } = useCotizaciones()

  return (
    <DashboardLayout
      pageTitle="Cotizaciones"
      navItems={NAV_ITEMS}
      onReload={() => window.location.reload()}
    >
      <h2 className="font-titles text-2xl font-extrabold text-[var(--color-nc-dark)]">Cotizaciones</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 flex flex-col gap-5">
          <CalculatorForm
            country={country} setCountry={setCountry} citiesLoading={citiesLoading}
            flatRate={flatRate} departments={departments} dept={dept} setDept={setDept}
            filteredCities={filteredCities} cityId={cityId} setCityId={setCityId}
            weight={weight} setWeight={setWeight} volWeight={volWeight} dims={dims}
            setDims={setDims} valor={valor} setValor={setValor} millas={millas}
            setMillas={setMillas} setError={setError} setResult={setResult}
          />

          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 shadow-sm">
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                <p className="font-subtitles text-xs font-bold uppercase text-red-700">No se pudo calcular</p>
                <p className="font-subtitles text-sm font-semibold text-red-700 mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 text-lg">×</button>
            </div>
          )}

          {result && <QuotationResult result={result} />}

          <div className="flex gap-3">
            <button
              onClick={handleCalc}
              disabled={!isValid || loading}
              className={`flex-1 btn-primary py-3 rounded-xl text-sm font-bold transition-opacity ${(!isValid || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Calculando...' : '📦 Calcular Envío'}
            </button>
            <button
              onClick={() => {
                if (!result) return setError('Primero realiza un cálculo antes de enviar a Odoo.')
                setIsOdooModalOpen(true)
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-[opacity,transform] hover:brightness-110 ${!result ? 'opacity-40 cursor-not-allowed' : 'active:scale-95 shadow-md'}`}
              style={{ background: '#714B67' }}
            >
              Enviar a Odoo
            </button>
          </div>
        </div>

        <MapPanel
          offices={offices}
          origin={origin}
          setOrigin={setOrigin}
          onDistanceChange={(m) => setMillas(String(m))}
        />
      </div>

      <OdooModal
        isOpen={isOdooModalOpen}
        onClose={() => setIsOdooModalOpen(false)}
        searchQuery={odooSearchQuery}
        setSearchQuery={setOdooSearchQuery}
        isSearching={isSearchingOdoo}
        customers={odooCustomers}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        isSending={isSendingToOdoo}
        error={odooError}
        success={odooSuccess}
        onSend={handleSendToOdoo}
      />
    </DashboardLayout>
  )
}
