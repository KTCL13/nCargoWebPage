'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'
import { EmployeeKPI } from '@/components/admin/employees/EmployeeKPI'
import { EmployeeFilters } from '@/components/admin/employees/EmployeeFilters'
import { EmployeeTable } from '@/components/admin/employees/EmployeeTable'
import { EmployeeModal } from '@/components/admin/employees/EmployeeModal'
import { ContractModal } from '@/components/admin/employees/ContractModal'
import { useEmployees } from '@/lib/admin/employees/useEmployees'
import { useEmployeeForm } from '@/lib/admin/employees/useEmployeeForm'
import { useContractForm } from '@/lib/admin/employees/useContractForm'

export default function EmpleadosPage() {
  const {
    employees, total, page, setPage, search, setSearch, pageSize, setPageSize,
    loading, filterStatus, setFilterStatus, filterRole, setFilterRole,
    dirty, selected, saving, roles, jobs, contractTypes, identificationTypes,
    fetchEmployees, toggleStatus, saveRow, saveAll, bulkUpdate, toggleSelect, toggleSelectAll
  } = useEmployees()

  const {
    showModal, setShowModal, modalLoading, modalError, editingId, isViewOnly, form, setForm,
    dupWarning, setDupWarning, setSkipDupCheck, openModal, handleSubmit
  } = useEmployeeForm(roles, fetchEmployees)

  const {
    contractModalOpen, setContractModalOpen, contractModalEmpName, contractModalLoading,
    contractModalError, contractForm, setContractForm, openContractModal, handleContractSubmit
  } = useContractForm(fetchEmployees)

  const hasDirty = Object.keys(dirty).length > 0

  return (
    <DashboardLayout
      pageTitle="Empleados"
      navItems={NAV_ITEMS}
      onReload={() => window.location.reload()}
    >
      <EmployeeKPI employees={employees} />

      <section className="bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-gray-100 overflow-hidden">
        <EmployeeFilters
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
          filterRole={filterRole} setFilterRole={setFilterRole}
          search={search} setSearch={setSearch}
          roles={roles} onAddEmployee={() => openModal()}
          setPage={setPage}
        />

        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50 border-b border-blue-100">
            <span className="text-sm font-subtitles text-blue-700 font-medium">
              {selected.size} seleccionado{selected.size > 1 ? 's' : ''}
            </span>
            <button onClick={() => bulkUpdate('ACTIVE')} className="text-xs px-3 py-1.5 rounded-[var(--radius-lg)] bg-green-600 text-white font-semibold hover:bg-green-700 transition">Activar</button>
            <button onClick={() => bulkUpdate('INACTIVE')} className="text-xs px-3 py-1.5 rounded-[var(--radius-lg)] bg-gray-500 text-white font-semibold hover:bg-gray-600 transition">Desactivar</button>
          </div>
        )}

        <EmployeeTable
          employees={employees} loading={loading} selected={selected}
          toggleSelect={toggleSelect} toggleSelectAll={toggleSelectAll}
          dirty={dirty} saving={saving} toggleStatus={toggleStatus}
          saveRow={saveRow} openModal={openModal} openContractModal={openContractModal}
        />

        <div className="px-5 py-4 border-t border-gray-100 flex flex-col gap-4 min-h-[100px]">
          {hasDirty && (
            <div className="flex justify-start">
              <button onClick={saveAll} className="text-sm px-4 py-2 rounded-[var(--radius-lg)] font-semibold font-subtitles bg-[var(--color-foreground)] text-white hover:opacity-80 transition shadow-sm">
                Guardar todo ({Object.keys(dirty).length})
              </button>
            </div>
          )}
          <Pagination page={page} pageSize={pageSize} totalItems={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </section>

      <EmployeeModal
        showModal={showModal} setShowModal={setShowModal} isViewOnly={isViewOnly}
        editingId={editingId} form={form} setForm={setForm}
        identificationTypes={identificationTypes} roles={roles}
        modalLoading={modalLoading} modalError={modalError} handleSubmit={handleSubmit}
        dupWarning={dupWarning} setDupWarning={setDupWarning} setSkipDupCheck={setSkipDupCheck}
      />

      <ContractModal
        contractModalOpen={contractModalOpen} setContractModalOpen={setContractModalOpen}
        contractModalEmpName={contractModalEmpName} contractForm={contractForm}
        setContractForm={setContractForm} jobs={jobs} contractTypes={contractTypes}
        contractModalLoading={contractModalLoading} contractModalError={contractModalError}
        handleContractSubmit={handleContractSubmit}
      />
    </DashboardLayout>
  )
}
