'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EmployeeDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/employee/jornada')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse font-titles text-lg">Cargando...</div>
    </div>
  )
}
