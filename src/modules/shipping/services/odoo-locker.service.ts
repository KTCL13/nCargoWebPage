import {
  searchLockerProjects,
  getTasksByProject,
  findStageByName,
  updateTaskStage,
  createTask,
  addTaskComment,
} from '@/lib/odoo-client'
import { lockerRepository, ShipmentFilters } from '../repositories/locker.repository'

class OdooLockerService {
  async syncFromOdoo(searchTerm?: string): Promise<{ lockers: number; shipments: number }> {
    const { providerId, statusId } = await lockerRepository.ensureLockerDefaults()
    const projects = await searchLockerProjects(searchTerm)

    let shipmentCount = 0
    for (const project of projects) {
      const locker = await lockerRepository.upsertLocker({
        odooProjectId: project.id,
        odooProjectName: project.name,
        customerName: project.partner_id ? project.partner_id[1] : null,
      })

      const tasks = await getTasksByProject(project.id)
      for (const task of tasks) {
        await lockerRepository.upsertShipmentFromTask({
          odooTaskId: task.id,
          odooTaskName: task.name,
          odooProjectId: project.id,
          odooProjectName: project.name,
          odooCustomerName: task.partner_id ? task.partner_id[1] : null,
          odooStageName: task.stage_id ? task.stage_id[1] : null,
          providerId,
          statusId,
          lockerId: locker.id,
        })
        shipmentCount++
      }
    }

    return { lockers: projects.length, shipments: shipmentCount }
  }

  async getAllLockers() {
    return lockerRepository.findAllLockers()
  }

  async getShipmentsForLocker(lockerId: number, search?: string) {
    return lockerRepository.findShipmentsByLocker(lockerId, search)
  }

  async getShipments(filters: ShipmentFilters) {
    return lockerRepository.findFiltered(filters)
  }

  async updateShipment(
    id: number,
    trackingNumber: string | undefined,
    odooStageName: string | undefined,
    comment: string | undefined,
    performedBy: number,
  ) {
    const shipment = await lockerRepository.findShipmentById(id)
    if (!shipment) throw new Error('Shipment not found')

    const updated = await lockerRepository.updateShipmentTracking(id, trackingNumber, odooStageName, performedBy)

    if (shipment.odooTaskId && shipment.odooProjectId && odooStageName) {
      try {
        const stage = await findStageByName(shipment.odooProjectId, odooStageName)
        if (stage) {
          await updateTaskStage(shipment.odooTaskId, stage.id)
        }
      } catch {
        return { ...updated, warning: 'Odoo sync failed — stage was not updated in Odoo' }
      }
    }

    if (shipment.odooTaskId && comment) {
      try {
        await addTaskComment(shipment.odooTaskId, comment)
      } catch {
        return { ...updated, warning: 'Odoo sync failed — comment was not posted to Odoo' }
      }
    }

    return updated
  }

  async createShipment(
    lockerId: number,
    name: string,
    description: string | undefined,
    performedBy: number,
  ) {
    const locker = await lockerRepository.findAllLockers().then(ls => ls.find(l => l.id === lockerId))
    if (!locker) throw new Error('Locker not found')

    const { providerId, statusId } = await lockerRepository.ensureLockerDefaults()

    const odooTaskId = await createTask(locker.odooProjectId, name, description)

    const shipment = await lockerRepository.upsertShipmentFromTask({
      odooTaskId,
      odooTaskName: name,
      odooProjectId: locker.odooProjectId,
      odooProjectName: locker.odooProjectName,
      odooCustomerName: locker.customerName ?? null,
      odooStageName: 'Pendiente',
      providerId,
      statusId,
      lockerId,
    })

    await lockerRepository.updateShipmentTracking(shipment.id, undefined, undefined, performedBy)

    return shipment
  }
}

export const odooLockerService = new OdooLockerService()
