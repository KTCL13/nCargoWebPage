'use client'

import { useState, useEffect } from 'react'
import { User } from '@/types/auth'

export function useProvideAuth() {
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

    return { user, token, login, logout }
}
