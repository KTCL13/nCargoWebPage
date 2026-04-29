//src/context/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type User = {
    id: number
    name: string
    email: string
    role: string
}

type AuthContextType = {
    user: User | null
    token: string | null
    login: (data: { user: User; token: string }) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)

    useEffect(() => {
        const storedUser = localStorage.getItem('auth_user')
        const storedToken = localStorage.getItem('auth_token')

        if (storedUser && storedToken) {
            const parsed: User = JSON.parse(storedUser)
            if (!parsed.id) {
                try {
                    const payload = JSON.parse(atob(storedToken.split('.')[1]))
                    parsed.id = payload.id
                } catch { }
            }
            setUser(parsed)
            setToken(storedToken)
        }
    }, [])

    const login = ({ user, token }: { user: User; token: string }) => {
        setUser(user)
        setToken(token)

        localStorage.setItem('auth_user', JSON.stringify(user))
        localStorage.setItem('auth_token', token)
    }

    const logout = () => {
        setUser(null)
        setToken(null)

        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_token')

        window.location.href = '/login'
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}