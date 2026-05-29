'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'
import { useContracts } from '@/lib/admin/contracts/useContracts'
import { contractsClient } from '@/lib/api-client/contracts'
import { ContractExportButtons } from '@/components/contracts/ContractExportButtons'
import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext'
import { useTableSort } from '@/hooks/useTableSort'
import { ModalShell } from '@/components/ui/ModalShell'

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  POR_HORA: 'Por hora',
  MENSUAL:  'Mensual',
}

function formatContractType(name: string | undefined): string {
  if (!name) return '—'
  return CONTRACT_TYPE_LABELS[name] ?? name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function ContratosClient() {
  const { user, token } = useAuth()
  const {
    contracts, total, page, setPage, search, setSearch, pageSize, setPageSize, loading,
    dirty, selected, setSelected, saving, historyOpen, setHistoryOpen, historyList, historyLoading, historyEmpId, historyEmpName,
    fetchContracts, toggleActive, saveRow, saveAll, openHistory
  } = useContracts()

  const { sortColumn, sortDirection, handleSort, sortedItems: sortedContracts } = useTableSort(
    contracts,
    { column: '' as string, direction: 'asc' },
    (c, column) => {
      switch (column) {
        case 'employee': return c.employee.name;
        case 'job': return c.job.title;
        case 'type': return c.contractType?.name ?? '';
        case 'salary': return c.salary ?? c.hourlyRate ?? 0;
        case 'active': return c.isActive;
        case 'start': return c.startDate ?? '';
        case 'end': return c.endDate ?? '';
        default: return '';
      }
    }
  );

  const bulkUpdate = async (isActive: boolean) => {
    await Promise.all([...selected].map(id => contractsClient.updateContract(id, { isActive })))
    setSelected(new Set()); fetchContracts()
  }

  const toggleSelect = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = () => setSelected(selected.size === contracts.length ? new Set() : new Set(contracts.map(c => c.id)))

  return (
    <DashboardLayout pageTitle="Contratos" navItems={NAV_ITEMS} onReload={fetchContracts}>
      <div className="bg-white rounded-[var(--radius-xl)] shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b">
          <h3 className="font-titles text-lg font-bold">Listado de Contratos</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="form-input pr-8 w-56"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600"> 🔍 </span>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50 border-b border-blue-100">
            <span className="text-sm font-medium text-blue-700">{selected.size} seleccionados</span>
            <button onClick={() => bulkUpdate(true)} className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white font-bold">Activar</button>
            <button onClick={() => bulkUpdate(false)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-500 text-white font-bold">Desactivar</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table role="grid" aria-label="Data table" className="w-full text-sm">
            <thead role="rowgroup">
              <tr role="row" className="border-b bg-gray-50">
                <th role="columnheader" className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={contracts.length > 0 && selected.size === contracts.length}
                    onChange={toggleSelectAll}
                    aria-label="Seleccionar todos"
                  />
                </th>
                {(["Empleado", "Último cargo", "Tipo", "Salario", "Vigente", "Inicio", "Fin", "Acciones"] as const).map((h) => {
                  const columnKeyMap: Record<string, string> = {
                    'Empleado': 'employee',
                    'Último cargo': 'job',
                    'Tipo': 'type',
                    'Salario': 'salary',
                    'Vigente': 'active',
                    'Inicio': 'start',
                    'Fin': 'end',
                    'Acciones': '',
                  }
                  const colKey = columnKeyMap[h]
                  const isSortable = colKey !== ''
                  return (
                    <th
                      role="columnheader"
                      key={h}
                      className={`px-4 py-3 text-left font-bold text-gray-500 uppercase text-[10px] ${isSortable ? 'cursor-pointer select-none hover:bg-gray-100 transition' : ''}`}
                      onClick={isSortable ? () => handleSort(colKey) : undefined}
                    >
                      {h}
                      {isSortable && (
                        <span className={`ml-1 ${sortColumn === colKey ? 'text-[var(--color-primary)]' : 'opacity-20'}`}>
                          {sortColumn === colKey ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody role="rowgroup">
              {loading ? (
                <tr role="row">
                  <td role="gridcell" colSpan={10} className="text-center py-10 text-gray-400">Cargando...</td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr role="row">
                  <td role="gridcell" colSpan={10} className="text-center py-10 text-gray-400">Sin resultados</td>
                </tr>
              ) : (
                sortedContracts.map((c) => {
                  const currentActive = dirty[c.id]?.isActive ?? c.isActive
                  const isDirty = dirty[c.id] !== undefined
                  const isSaving = saving.has(c.id)
                  return (
                    <tr role="row" key={c.id} className="border-b hover:bg-gray-50/50 transition">
                      <td role="gridcell" className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          aria-label={`Seleccionar contrato ${c.id}`}
                        />
                      </td>

                      {/* Empleado */}
                      <td role="gridcell" className="px-4 py-3">
                        <p className="font-bold">{c.employee.name}</p>
                        <p className="text-[10px] text-gray-400">{c.employee.email}</p>
                      </td>

                      {/* Último cargo */}
                      <td role="gridcell" className="px-4 py-3 font-medium text-gray-700">{c.job.title}</td>

                      {/* Tipo de contrato */}
                      <td role="gridcell" className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          c.contractType?.name === 'POR_HORA'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {formatContractType(c.contractType?.name)}
                        </span>
                      </td>

                      {/* Salario */}
                      <td role="gridcell" className="px-4 py-3 text-xs font-mono text-gray-700">
                        {c.salary ? `$${Number(c.salary).toLocaleString('es-CO')}` : c.hourlyRate ? `$${Number(c.hourlyRate).toLocaleString('es-CO')}/h` : '—'}
                      </td>

                      {/* Toggle Vigente */}
                      <td role="gridcell" className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(c.id, c.isActive)}
                          aria-label={currentActive ? 'Desactivar contrato' : 'Activar contrato'}
                          className={`w-9 h-5 rounded-full relative transition-colors ${currentActive ? 'bg-green-500' : 'bg-gray-200'}`}
                        >
                          <span className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow transition-all ${currentActive ? 'left-5' : 'left-1'}`} />
                        </button>
                      </td>

                      {/* Fechas */}
                      <td role="gridcell" className="px-4 py-3 text-xs text-gray-500">{fmt(c.startDate)}</td>
                      <td role="gridcell" className="px-4 py-3 text-xs text-gray-500">{fmt(c.endDate)}</td>

                      {/* Acciones */}
                      <td role="gridcell" className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isDirty && (
                            <button
                              onClick={() => saveRow(c.id)}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors"
                            >
                              {isSaving ? (
                                <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              ) : '✓'} Guardar
                            </button>
                          )}
                          <button
                            onClick={() => openHistory(c.employee.id, c.employee.name)}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors whitespace-nowrap"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Historial
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t">
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Modal historial de contratos */}
      <ModalShell
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Historial de contratos"
        subtitle={historyEmpName}
        cancelLabel="Cerrar"
        maxWidth="lg"
      >
        {/* Export buttons */}
        {historyEmpId !== null && user?.id && token && (
          <div className="-mx-6 -mt-5 px-6 py-3 border-b border-gray-100 bg-gray-50/60 mb-4">
            <ContractExportButtons
              employeeId={historyEmpId}
              employeeName={historyEmpName}
              generatedBy={user.id}
              token={token}
            />
          </div>
        )}

        {/* Lista de contratos */}
        <div className="space-y-3">
          {historyLoading ? (
            <p className="text-center text-gray-400 py-8" aria-live="polite">Cargando...</p>
          ) : historyList.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Sin contratos registrados</p>
          ) : (
            historyList.map((hc) => (
              <div key={hc.id} className={`rounded-xl border p-4 transition-colors ${hc.isActive ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200 bg-gray-50/60'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-sm text-gray-800">{hc.job.title}</span>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    hc.isActive
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}>
                    {hc.isActive ? '● Activo' : '○ Cerrado'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                    hc.contractType?.name === 'POR_HORA'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {formatContractType(hc.contractType?.name)}
                  </span>
                  <span className="text-gray-400">
                    {fmt(hc.startDate)} — {fmt(hc.endDate)}
                  </span>
                  {(hc.salary || hc.hourlyRate) && (
                    <span className="font-mono text-gray-600">
                      {hc.salary ? `$${Number(hc.salary).toLocaleString('es-CO')}` : `$${Number(hc.hourlyRate).toLocaleString('es-CO')}/h`}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ModalShell>
    </DashboardLayout>
  )
}
