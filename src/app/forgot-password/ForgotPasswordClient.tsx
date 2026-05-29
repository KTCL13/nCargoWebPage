'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const SuccessMessage = dynamic(() => import('./SuccessMessage'), {
  loading: () => <div className="text-center p-4 text-sm text-gray-500">Cargando...</div>,
})

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message ?? 'Ocurrió un error. Intenta de nuevo.'); return }
      setSent(true)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return <SuccessMessage />

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-subtitles font-semibold text-gray-700 uppercase tracking-widest mb-1">
          Email
        </label>
        <input
          type="email"
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="form-input"
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm font-subtitles">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary py-3 w-full mt-2 disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar enlace'}
      </button>

      <div className="text-center mt-4">
        <Link
          href="/login"
          className="text-xs font-subtitles font-semibold text-gray-500 hover:text-[var(--color-nc-red)] transition-colors uppercase tracking-wider"
        >
          ← Volver al login
        </Link>
      </div>
    </form>
  )
}
