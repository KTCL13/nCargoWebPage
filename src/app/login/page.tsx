"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { AuthFormCard } from "@/components/ui/AuthFormCard"

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [bgImage, setBgImage] = useState("/images/website/55.PNG")

  useEffect(() => {
    const fetchAssets = async () => {
      const url = process.env.NEXT_PUBLIC_STRAPI_URL
      if (!url) return

      try {
        const res = await fetch(`${url}/api/login-page?populate=*`)
        if (!res.ok) throw new Error("Strapi no disponible")

        const json = await res.json()
        const d = json.data
        const base = url.replace(/\/$/, "")

        const bg = d?.Fondo_login?.url
        if (bg) setBgImage(base + bg)
      } catch {
        // keep default fallback
      }
    }

    fetchAssets()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Credenciales incorrectas")

      const payload = JSON.parse(atob(json.accessToken.split(".")[1]))
      login({ user: { id: payload.id, name: json.name, email: json.email, role: json.role }, token: json.accessToken })

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) {
        fetch("/api/employee/me", {
          method: "PATCH",
          headers: { Authorization: `Bearer ${json.accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ timezone: tz }),
        }).catch(() => {})
      }

      router.push(json.role === "ADMIN" ? "/admin/dashboard" : "/employee/jornada")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFormCard title="LOGIN" imageSrc={bgImage}>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-xs font-subtitles font-semibold text-gray-700 uppercase tracking-widest mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-subtitles font-semibold text-gray-700 uppercase tracking-widest mb-1">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input pr-12"
              required
            />
            <button
              type="button"
              aria-label="Mostrar u ocultar contraseña"
              onClick={() => setShowPass(p => !p)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-gray-500 hover:text-[var(--color-nc-dark)] transition-colors"
            >
              <EyeIcon open={showPass} />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm font-subtitles">{error}</p>
        )}

        <div className="text-right -mt-2">
          <Link href="/forgot-password" className="text-xs font-subtitles text-gray-500 hover:text-[var(--color-nc-red)] transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary py-3 w-full disabled:opacity-50"
        >
          {loading ? "Cargando..." : "Iniciar sesión"}
        </button>
      </form>
    </AuthFormCard>
  )
}
