export type RoleType = 'ADMIN' | 'EMPLOYEE'

export type LoginDto = {
    email: string
    password: string
}

export type RegisterDto = {
    name: string
    email: string
    password: string
    role: RoleType
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