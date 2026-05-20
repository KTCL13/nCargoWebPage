/// <reference types="jest" />

// =====================================================================
// Pruebas unitarias del JobService
// =====================================================================

jest.mock('../../repositories/job.repository', () => ({
  jobRepository: {
    findAll: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))

import { jobService } from '../job.service'
import { jobRepository } from '../../repositories/job.repository'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

const fakeJob = { id: 1, title: 'Dev', description: 'senior role' }

// =====================================================================
// findAll
// =====================================================================
describe('jobService.findAll', () => {
  it('G1 happy path: retorna { data, total }', async () => {
    mocked(jobRepository.findAll).mockResolvedValue([fakeJob])
    mocked(jobRepository.count).mockResolvedValue(1)

    const result = await jobService.findAll()

    expect(jobRepository.findAll).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ data: [fakeJob], total: 1 })
  })

  it('G2 error de negocio: repo lanza → propaga', async () => {
    mocked(jobRepository.findAll).mockRejectedValue(new Error('DB down'))
    mocked(jobRepository.count).mockResolvedValue(0)

    await expect(jobService.findAll()).rejects.toThrow('DB down')
  })

  it('G3 caso inválido controlado: repo retorna [] → data:[] total:0', async () => {
    mocked(jobRepository.findAll).mockResolvedValue([])
    mocked(jobRepository.count).mockResolvedValue(0)

    const result = await jobService.findAll()

    expect(result).toEqual({ data: [], total: 0 })
  })
})

// =====================================================================
// findOne
// =====================================================================
describe('jobService.findOne', () => {
  it('G1 happy path: retorna el job', async () => {
    mocked(jobRepository.findById).mockResolvedValue(fakeJob)

    const result = await jobService.findOne(1)

    expect(jobRepository.findById).toHaveBeenCalledWith(1)
    expect(result).toEqual(fakeJob)
  })

  it('G2 error de negocio: job no existe → lanza "Job not found with id X"', async () => {
    mocked(jobRepository.findById).mockResolvedValue(null)

    await expect(jobService.findOne(999)).rejects.toThrow('Job not found with id 999')
  })

  it('G3 caso inválido controlado: id=NaN → repo retorna null → mismo error', async () => {
    // caso inválido controlado
    mocked(jobRepository.findById).mockResolvedValue(null)

    await expect(jobService.findOne(NaN)).rejects.toThrow('Job not found with id NaN')
  })
})

// =====================================================================
// create
// =====================================================================
describe('jobService.create', () => {
  const dto = { title: 'Engineer', description: 'senior' }

  it('G1 happy path: crea y retorna DTO', async () => {
    mocked(jobRepository.create).mockResolvedValue({ id: 10, ...dto })

    const result = await jobService.create(dto)

    expect(jobRepository.create).toHaveBeenCalledWith(dto)
    expect(result.id).toBe(10)
  })

  it('G2 error de negocio: repo lanza (unique) → propaga', async () => {
    mocked(jobRepository.create).mockRejectedValue(new Error('Unique constraint failed'))

    await expect(jobService.create(dto)).rejects.toThrow('Unique constraint failed')
  })

  it('G3 caso inválido controlado: description opcional omitida → repo recibe sin description', async () => {
    // caso inválido controlado
    mocked(jobRepository.create).mockResolvedValue({ id: 10, title: 'Engineer', description: null })

    const result = await jobService.create({ title: 'Engineer' })

    expect(jobRepository.create).toHaveBeenCalledWith({ title: 'Engineer' })
    expect(result.description).toBeNull()
  })
})

// =====================================================================
// update
// =====================================================================
describe('jobService.update', () => {
  it('G1 happy path: actualiza y retorna DTO', async () => {
    mocked(jobRepository.update).mockResolvedValue({ ...fakeJob, title: 'New' })

    const result = await jobService.update(1, { title: 'New' })

    expect(jobRepository.update).toHaveBeenCalledWith(1, { title: 'New' })
    expect(result.title).toBe('New')
  })

  it('G2 error de negocio: id no existe → propaga', async () => {
    mocked(jobRepository.update).mockRejectedValue(new Error('Record to update not found'))

    await expect(jobService.update(999, { title: 'x' })).rejects.toThrow('Record to update not found')
  })

  it('G3 caso inválido controlado: data={} → repo recibe {} sin crash', async () => {
    // caso inválido controlado
    mocked(jobRepository.update).mockResolvedValue(fakeJob)

    await jobService.update(1, {})

    expect(jobRepository.update).toHaveBeenCalledWith(1, {})
  })
})

// =====================================================================
// remove
// =====================================================================
describe('jobService.remove', () => {
  it('G1 happy path: elimina sin retornar valor', async () => {
    mocked(jobRepository.delete).mockResolvedValue(undefined)

    await jobService.remove(1)

    expect(jobRepository.delete).toHaveBeenCalledWith(1)
  })

  it('G2 error de negocio: id no existe → propaga', async () => {
    mocked(jobRepository.delete).mockRejectedValue(new Error('Record to delete not found'))

    await expect(jobService.remove(999)).rejects.toThrow('Record to delete not found')
  })

  it('G3 caso inválido controlado: id=NaN → repo recibe NaN sin crash propio', async () => {
    // caso inválido controlado
    mocked(jobRepository.delete).mockResolvedValue(undefined)

    await jobService.remove(NaN)

    expect(jobRepository.delete).toHaveBeenCalledWith(NaN)
  })
})
