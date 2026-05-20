export interface ProfileData {
  id: number
  firstName: string
  lastName: string
  email: string
  identificationNumber: string
  timezone: string
  identificationType: {
    id: number
    name: string
  }
  contracts?: Array<{
    id: number
    isActive: boolean
    job: {
      title: string
    }
  }>
}

export interface ProfileFormData {
  firstName: string
  lastName: string
  timezone: string
}
