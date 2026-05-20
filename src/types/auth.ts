export type User = {
    id: number
    name: string
    email: string
    role: string
}

export type AuthContextType = {
    user: User | null
    token: string | null
    login: (data: { user: User; token: string }) => void
    logout: () => void
}
