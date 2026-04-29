'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function ResetPasswordPage() {
  const params                      = useParams()
  const token                       = params.token as string
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [showConf, setShowConf]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? 'Ocurrió un error. Intenta de nuevo.')
        return
      }

      setSuccess(true)
      setTimeout(() => { window.location.href = '/login' }, 2000)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="hidden md:block md:w-[45%] relative flex-shrink-0 bg-[#FF003B]">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      <div className="flex-1 bg-[#EBEBEB] flex flex-col items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm">

          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[#040626] text-center tracking-tight mb-2"
            style={{ fontFamily: "'League Spartan', sans-serif" }}
          >
            Nueva contraseña
          </h1>

          <p
            className="text-sm text-gray-500 text-center mb-7"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Elige una contraseña nueva para tu cuenta.
          </p>

          {success ? (
            <div className="text-center">
              <p
                className="text-sm text-[#040626] px-4 py-3 rounded-xl bg-white border border-black/10 mb-5"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                ¡Contraseña actualizada! Redirigiendo al login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="
                    w-full py-3.5 pl-4 pr-11 rounded-xl
                    border border-black/10 bg-[#F5F5F5]
                    text-sm text-[#040626]
                    outline-none transition-colors duration-150
                    focus:border-[#FF003B]
                  "
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-lg text-gray-400 p-0 leading-none"
                >
                  {showPass ? '🔓' : '🔒'}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConf ? 'text' : 'password'}
                  placeholder="Confirmar contraseña"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="
                    w-full py-3.5 pl-4 pr-11 rounded-xl
                    border border-black/10 bg-[#F5F5F5]
                    text-sm text-[#040626]
                    outline-none transition-colors duration-150
                    focus:border-[#FF003B]
                  "
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConf(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-lg text-gray-400 p-0 leading-none"
                >
                  {showConf ? '🔓' : '🔒'}
                </button>
              </div>

              {error && (
                <p
                  className="text-xs text-[#FF003B] text-center px-3 py-2 rounded-lg bg-[#FF003B]/[0.08] border border-[#FF003B]/20"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`
                  w-full py-3.5 rounded-xl border-none
                  font-bold text-base tracking-wide
                  shadow-[0_2px_12px_rgba(4,6,38,0.12)]
                  transition-all duration-200
                  ${loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-[#040626] cursor-pointer hover:bg-[#FF003B] hover:text-white hover:shadow-[0_4px_20px_rgba(255,0,59,0.35)]'
                  }
                `}
                style={{ fontFamily: "'League Spartan', sans-serif" }}
              >
                {loading ? 'Guardando...' : 'Guardar contraseña'}
              </button>

              <p
                className="text-xs text-gray-400 text-center mt-1"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                ¿Enlace expirado?{' '}
                <a href="/forgot-password" className="text-[#040626] font-bold no-underline hover:text-[#FF003B] transition-colors">
                  Solicitar nuevo enlace
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
