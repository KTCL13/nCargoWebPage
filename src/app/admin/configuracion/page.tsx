'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useAuth } from '@/context/AuthContext'
import { useConfig } from '@/lib/admin/config/useConfig'
import { RatesTable } from '@/components/admin/configuracion/RatesTable'
import { CONFIG_LABELS, CONTRACT_CONFIG_KEYS, Country } from '@/types/admin/config'

const CLS = {
  card: 'bg-white rounded-xl p-5 mb-6 shadow',
  grid: 'grid grid-cols-2 md:grid-cols-3 gap-4',
  input: 'form-input w-full',
  btn: 'px-3 py-2 rounded text-white text-sm',
  label: 'text-sm text-gray-600 font-medium',
}

function flagEmoji(code: string) {
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.codePointAt(0)! + 127397))
}

export default function ConfiguracionPage() {
  const { token } = useAuth()
  const {
    providers, countries, ratesByCountry, locsByCountry, flatByCountry, setFlatByCountry,
    newRateByCountry, setNewRateByCountry, configs, loading, saving,
    providerId, setProviderId, contractCfg, setContractCfg, savingCfgKey,
    load, saveFlatRate, saveRate, saveLocation, deleteRate, addRate, saveConfig, saveContractCfg
  } = useConfig(token)

  const [activeTab, setActiveTab] = useState<'cotizaciones' | 'contratos'>('cotizaciones')

  if (loading) {
    return (
      <DashboardLayout pageTitle="Configuración" navItems={NAV_ITEMS}>
        <p className="text-gray-400 animate-pulse">Cargando configuración...</p>
      </DashboardLayout>
    )
  }

  const RatesSection = ({ c }: { c: Country }) => {
    const flat = flatByCountry[c.code] ?? { enabled: false, price: '0' }
    const rates = ratesByCountry[c.code] ?? []
    const locations = locsByCountry[c.code] ?? []
    const nr = newRateByCountry[c.code] ?? { destId: '', price: '' }
    return (
      <div className={`${CLS.card} !p-0 overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold">{flagEmoji(c.code)} Tarifas USA → {c.name}</h3>
          <span className="text-xs text-gray-400 font-mono">{c.code}</span>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={flat.enabled} onChange={e => setFlatByCountry(prev => ({ ...prev, [c.code]: { ...flat, enabled: e.target.checked } }))} className="w-4 h-4" />
            <span className="text-sm font-semibold">Tarifa plana</span>
          </label>
          {flat.enabled && <input type="number" value={flat.price} onChange={e => setFlatByCountry(prev => ({ ...prev, [c.code]: { ...flat, price: e.target.value } }))} className={`${CLS.input} w-28`} placeholder="USD" step="0.01" />}
          <button onClick={() => saveFlatRate(c.code)} disabled={saving === `flat-${c.code}`} className={`${CLS.btn} bg-green-600 disabled:opacity-50`}>{saving === `flat-${c.code}` ? '...' : '💾 Guardar'}</button>
        </div>
        {!flat.enabled && (
          <div className="p-4">
            <RatesTable
              rates={rates} locations={locations} newRate={nr}
              onNewRateChange={r => setNewRateByCountry(prev => ({ ...prev, [c.code]: r }))}
              onSaveRate={saveRate} onSaveLocation={saveLocation} onDeleteRate={deleteRate}
              onAddRate={() => addRate(c.code)} addSaving={saving === `add-${c.code}`}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <DashboardLayout pageTitle="Configuración" navItems={NAV_ITEMS} onReload={load}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-gray-500 text-sm">Gestión de tarifas, variables de contratos y constantes globales</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {([['cotizaciones', '📦 Cotizaciones'], ['contratos', '📄 Variables de Contratos']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === t ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
        ))}
      </div>

      {activeTab === 'cotizaciones' ? (
        <div className="space-y-6">
          <div className={CLS.card}>
            <h3 className="font-bold mb-4">Proveedor de Envíos & Constantes</h3>
            <div className={CLS.grid}>
              <div><label className={CLS.label}>Transportadora</label><select value={providerId ?? ''} onChange={e => setProviderId(Number(e.target.value))} className={CLS.input}>{providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              {configs.map(cfg => (
                <div key={cfg.key}><label className={CLS.label}>{CONFIG_LABELS[cfg.key] ?? cfg.key}</label><div className="flex gap-2"><input type="number" step="0.01" defaultValue={String(cfg.value)} onBlur={e => saveConfig(cfg.key, e.target.value)} className={CLS.input} /><button className="bg-gray-100 p-2 rounded hover:bg-gray-200">💾</button></div></div>
              ))}
            </div>
          </div>
          {countries.map(c => <RatesSection key={c.id} c={c} />)}
        </div>
      ) : (
        <div className={CLS.card}>
          <h3 className="font-bold mb-4 text-gray-800">Variables de Nómina y Contratación</h3>
          <div className="space-y-6">
            {CONTRACT_CONFIG_KEYS.map(cfg => (
              <div key={cfg.key} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex-1"><label className="block text-sm font-bold text-gray-700 mb-0.5">{cfg.label}</label><p className="text-xs text-gray-500">{cfg.hint}</p></div>
                <div className="flex items-center gap-2">
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">{cfg.prefix}</span><input type="number" step={cfg.step} value={contractCfg[cfg.key] ?? ''} onChange={e => setContractCfg(prev => ({ ...prev, [cfg.key]: e.target.value }))} className={`form-input w-40 ${cfg.prefix ? 'pl-7' : ''} font-mono text-right`} /></div>
                  <button onClick={() => saveContractCfg(cfg.key)} disabled={savingCfgKey === cfg.key} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition">{savingCfgKey === cfg.key ? '...' : 'Guardar'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
