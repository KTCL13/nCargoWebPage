//src/context/AuthContext.tsx
'use client'

import { createContext } from 'react'
import { AuthContextType } from '@/types/auth'
import { useProvideAuth } from '@/hooks/useProvideAuth'
export { useAuth } from '@/hooks/useAuth'

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const auth = useProvideAuth()

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    )
}