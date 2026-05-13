import { useEmployeeFormState } from '@/hooks/useEmployeeFormState'
import { useEmployeeModal } from '@/hooks/useEmployeeModal'
import { useEmployeeSubmit } from '@/hooks/useEmployeeSubmit'
import { Role } from '@/types/admin/employees'

export function useEmployeeForm(roles: Role[], fetchEmployees: () => void) {
  const { form, setForm } = useEmployeeFormState()
  
  // Submit handles warning states internally, but modal resets them on open.
  // We can just lift the warning state to the submit hook.
  
  const submit = useEmployeeSubmit(
    form, null, () => {}, () => {}, () => {}, fetchEmployees // Temporarily, we will link them
  )
  
  const modal = useEmployeeModal(
    roles, setForm, submit.setDupWarning, submit.setSkipDupCheck
  )
  
  // Re-bind submit with modal's actual dependencies
  const submitLogic = useEmployeeSubmit(
    form, modal.editingId, modal.setModalError, 
    modal.setModalLoading, modal.setShowModal, fetchEmployees
  )

  return {
    ...modal, form, setForm, ...submitLogic
  }
}
