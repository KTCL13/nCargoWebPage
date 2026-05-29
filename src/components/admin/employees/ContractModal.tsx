import React, { useState } from 'react'
import { Job, ContractType } from '@/types/admin/employees'
import { ContractFormFields, BaseContractForm } from './ContractFormFields'
import { AdminModal } from './AdminModal'

interface ContractModalProps<T extends BaseContractForm> {
  contractModalOpen: boolean
  setContractModalOpen: (open: boolean) => void
  contractModalEmpName: string
  contractForm: T
  setContractForm: React.Dispatch<React.SetStateAction<T>>
  jobs: Job[]
  contractTypes: ContractType[]
  contractModalLoading: boolean
  contractModalError: string
  handleContractSubmit: (e: React.FormEvent) => void
}

export function ContractModal<T extends BaseContractForm>({
  contractModalOpen, setContractModalOpen, contractModalEmpName,
  contractForm, setContractForm, jobs, contractTypes,
  contractModalLoading, contractModalError, handleContractSubmit
}: ContractModalProps<T>) {
  const [dateValidationError, setDateValidationError] = useState<string | null>(null)

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (dateValidationError) return
    handleContractSubmit(e)
  }

  return (
    <AdminModal
      isOpen={contractModalOpen}
      onClose={() => setContractModalOpen(false)}
      title="Nuevo Contrato"
      description={`Asignar cargo y salario a ${contractModalEmpName}`}
      error={contractModalError}
      loading={contractModalLoading}
      disableSubmit={!!dateValidationError}
      submitText="Crear Contrato"
      submitButtonClass="bg-green-600 hover:bg-green-700"
      onSubmit={onFormSubmit}
    >
      <ContractFormFields
        form={contractForm}
        setForm={setContractForm}
        jobs={jobs}
        contractTypes={contractTypes}
        idPrefix="contract-"
        onValidationError={setDateValidationError}
      />
    </AdminModal>
  )
}
