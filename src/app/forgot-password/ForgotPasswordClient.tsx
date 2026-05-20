'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const SuccessMessage = dynamic(() => import('./SuccessMessage'), {
  loading: () => <div className="text-center p-4 text-sm text-gray-500">Cargando...</div>,
})

const FONTS = {
  title: "'League Spartan', sans-serif",
  body: "'Poppins', sans-serif",
} as const;

const CLASSES = {
  input:
    "w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F9FAFB] text-sm text-[#040626] outline-none focus:border-[#FF003B] focus:ring-2 focus:ring-[#FF003B]/25 transition-[border-color,box-shadow] duration-200",
  label:
    "text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1 block",
};

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

      if (!res.ok) {
        setError(data.message ?? 'Ocurrió un error. Intenta de nuevo.')
        return
      }

      setSent(true)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return <SuccessMessage />
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={CLASSES.label}>Email</label>
        <input
          type="email"
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className={CLASSES.input}
          style={{ fontFamily: FONTS.body }}
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm" style={{ fontFamily: FONTS.body }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="py-3 mt-2 rounded-xl font-bold text-white bg-gradient-to-r from-[#040626] to-[#FF003B] transition-[opacity,transform] duration-200 hover:opacity-90 disabled:opacity-50"
        style={{ fontFamily: FONTS.title }}
      >
        {loading ? 'Enviando...' : 'Enviar enlace'}
      </button>

      <div className="text-center mt-4">
        <Link 
          href="/login" 
          className="text-xs text-gray-500 hover:text-[#FF003B] font-semibold transition-colors uppercase tracking-wider"
          style={{ fontFamily: FONTS.body }}
        >
          ← Volver al login
        </Link>
      </div>
    </form>
  )
}
