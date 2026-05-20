export type RoleType = 'ADMIN' | 'EMPLOYEE'

export type LoginDto = {
    email: string
    password: string
}

export type RegisterDto = {
    firstName: string
    lastName: string
    identificationNumber?: string
    identificationTypeId?: number
    email: string
    password: string
}

export type AuthResponseDto = {
    accessToken: string
    role: RoleType
    email: string
    name: string
}

export type ForgotPasswordDto = {
    email: string
}

export type ResetPasswordDto = {
    token: string
    password: string
}
