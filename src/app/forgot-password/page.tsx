'use client'

import { useState } from 'react'
import Image from "next/image";
import Link from "next/link";

/* ── Tipos y Constantes ───────────────────────────────────────────── */
const FONTS = {
  title: "'League Spartan', sans-serif",
  body: "'Poppins', sans-serif",
} as const;

const CLASSES = {
  input:
    "w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F9FAFB] text-sm text-[#040626] outline-none focus:border-[#FF003B] focus:ring-2 focus:ring-[#FF003B]/25 transition-all",
  label:
    "text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1 block",
};

/* ── Helpers ─────────────────────────────────────────────────────── */
const SafeImage = ({ src, fill, ...props }: any) =>
  src ? (
    <Image src={src} fill={fill} {...props} />
  ) : (
    <div
      {...props}
      className={`bg-gradient-to-br from-[#040626] to-[#FF003B] ${props.className || ""}`}
    />
  );

export default function ForgotPasswordPage() {
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

  return (
    <div className="min-h-screen flex">
      {/* Panel Izquierdo */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-center items-center overflow-hidden">
        <SafeImage src="/images/website/55.PNG" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#040626]/85 via-[#0C1E8C]/55 to-[#E8002E]/35" />

        <div className="relative z-10 text-center max-w-lg space-y-8 px-12">
          <h1 className="font-extrabold text-white leading-tight text-4xl" style={{ fontFamily: FONTS.title }}>
            Conectando Familias
            <br />a Través de Fronteras
          </h1>
          <p className="text-white/80 text-lg" style={{ fontFamily: FONTS.body }}>
            Gestiona envíos con <strong>N-Cargo</strong>.
          </p>
        </div>
      </div>

      {/* Panel Derecho */}
      <main className="flex-1 flex items-center justify-center bg-[#F9FAFB] px-6 py-10">
        <div className="w-full max-w-[400px]">
          <h2 className="mb-2 text-center font-black text-[#040626] text-2xl uppercase tracking-tight" style={{ fontFamily: FONTS.title }}>
            RECUPERAR CONTRASEÑA
          </h2>
          
          <p className="text-sm text-gray-500 text-center mb-8" style={{ fontFamily: FONTS.body }}>
            Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña.
          </p>

          {sent ? (
            <div className="text-center space-y-6">
              <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-sm text-green-800" style={{ fontFamily: FONTS.body }}>
                Si el email está registrado, recibirás un enlace en tu bandeja de entrada.
              </div>
              <Link
                href="/login"
                className="inline-block text-sm font-bold text-[#040626] hover:text-[#FF003B] transition-colors"
                style={{ fontFamily: FONTS.body }}
              >
                ← Volver al login
              </Link>
            </div>
          ) : (
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
                className="py-3 mt-2 rounded-xl font-bold text-white bg-gradient-to-r from-[#040626] to-[#FF003B] transition-all hover:opacity-90 disabled:opacity-50"
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
          )}
        </div>
      </main>
    </div>
  )
}

