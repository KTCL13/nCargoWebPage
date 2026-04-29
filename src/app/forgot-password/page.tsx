'use client'

import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)

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
            Recuperar contraseña
          </h1>

          <p
            className="text-sm text-gray-500 text-center mb-7"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña.
          </p>

          {sent ? (
            <div className="text-center">
              <p
                className="text-sm text-[#040626] px-4 py-3 rounded-xl bg-white border border-black/10 mb-5"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Si el email está registrado, recibirás un enlace en tu bandeja de entrada.
              </p>
              <a
                href="/login"
                className="text-sm font-bold text-[#040626] no-underline hover:text-[#FF003B] transition-colors"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                ← Volver al login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <input
                type="email"
                placeholder="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="
                  w-full py-3.5 pl-4 pr-4 rounded-xl
                  border border-black/10 bg-[#F5F5F5]
                  text-sm text-[#040626]
                  outline-none transition-colors duration-150
                  focus:border-[#FF003B]
                "
                style={{ fontFamily: "'Poppins', sans-serif" }}
              />

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
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>

              <p
                className="text-xs text-gray-400 text-center mt-1"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <a href="/login" className="text-[#040626] font-bold no-underline hover:text-[#FF003B] transition-colors">
                  ← Volver al login
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
