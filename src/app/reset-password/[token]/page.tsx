'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AuthFormCard } from '@/components/ui/AuthFormCard'

export default function ResetPasswordPage() {
  const params = useParams()
  const token = params.token as string
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message ?? 'Ocurrió un error. Intenta de nuevo.'); return }
      setSuccess(true)
      setTimeout(() => { window.location.href = '/login' }, 2000)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthFormCard title="CONTRASEÑA ACTUALIZADA">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl" aria-hidden="true">✅</div>
          <p className="font-subtitles text-sm text-gray-600">
            Tu contraseña fue actualizada. Redirigiendo al login...
          </p>
        </div>
      </AuthFormCard>
    )
  }

  return (
    <AuthFormCard title="NUEVA CONTRASEÑA" subtitle="Crea una contraseña segura para tu cuenta.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-subtitles font-semibold text-gray-700 uppercase tracking-widest mb-1">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="form-input pr-12"
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-subtitles font-semibold text-gray-700 uppercase tracking-widest mb-1">
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              type={showConf ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="form-input pr-12"
              placeholder="Repite la contraseña"
            />
            <button
              type="button"
              onClick={() => setShowConf(p => !p)}
              aria-label={showConf ? 'Ocultar confirmación' : 'Mostrar confirmación'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConf ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm font-subtitles">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary py-3 w-full mt-2 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>

        <div className="text-center space-y-2">
          <p className="text-xs font-subtitles text-gray-400">
            ¿Enlace expirado?{' '}
            <Link href="/forgot-password" className="text-[var(--color-nc-dark)] font-bold hover:text-[var(--color-nc-red)] transition-colors">
              Solicitar nuevo enlace
            </Link>
          </p>
          <Link href="/login" className="text-xs font-subtitles text-gray-500 hover:text-[var(--color-nc-red)] transition-colors uppercase tracking-wider">
            ← Volver al login
          </Link>
        </div>
      </form>
    </AuthFormCard>
  )
}
