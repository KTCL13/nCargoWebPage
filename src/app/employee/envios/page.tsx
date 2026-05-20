'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useEnvios } from '@/lib/employee/envios/useEnvios'
import { ShipmentsTable } from '@/components/employee/envios/ShipmentsTable'
import { ShipmentSearch } from '@/components/employee/envios/ShipmentSearch'

export default function EmployeeEnviosPage() {
  const {
    shipments, total, page, setPage, pageSize, setPageSize, loading,
    search, setSearch, editingId, setEditingId, editValue, setEditValue,
    saving, rowFeedback, fetchShipments, startEdit, saveTracking
  } = useEnvios()

  return (
    <DashboardLayout pageTitle="Mis Envíos" navItems={NAV_ITEMS} onReload={fetchShipments}>
      <div className="space-y-6">
        <div>
          <h2 className="font-titles text-2xl font-extrabold">Envíos de Casilleros</h2>
          <p className="text-gray-500 text-sm">{total} envío{total !== 1 ? 's' : ''} registrados</p>
        </div>

        <ShipmentSearch search={search} setSearch={setSearch} />

        <ShipmentsTable
          shipments={shipments}
          loading={loading}
          editingId={editingId}
          setEditingId={setEditingId}
          editValue={editValue}
          setEditValue={setEditValue}
          saveTracking={saveTracking}
          saving={saving}
          rowFeedback={rowFeedback}
          startEdit={startEdit}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          total={total}
        />
      </div>
    </DashboardLayout>
  )
}
