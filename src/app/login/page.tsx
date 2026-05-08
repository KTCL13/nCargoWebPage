"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/* ── Tipos y Constantes ───────────────────────────────────────────── */
type Assets = { logo: string; bg: string };

const FONTS = {
  title: "'League Spartan', sans-serif",
  body: "'Poppins', sans-serif",
} as const;

const CLASSES = {
  input:
    "w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 bg-[#F9FAFB] text-sm text-[#040626] outline-none focus:border-[#FF003B] focus:ring-2 focus:ring-[#FF003B]/25 transition-all",
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

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
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
);

/* ── Componente Principal ───────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [data, setData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [ui, setUi] = useState({
    showPass: false,
    loading: false,
    error: "",
    assets: { logo: "", bg: "/images/website/55.PNG" } as Assets,
  });

  /* ── Cargar assets (logo / fondo) ───────────────────────────── */
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

    fetch(`${url}/api/login-page?populate=*`)
      .then((r) => r.json())
      .then((res) => {
        const d = res.data;
        const base = url.replace(/\/$/, "");

        setUi((prev) => ({
          ...prev,
          assets: {
            logo: d?.logo?.url ? base + d.logo.url : "",
            bg: d?.Fondo_login?.url ? base + d.Fondo_login.url : "",
          },
        }));
      })
      .catch(() => { });
  }, []);

  /* ── Login Profesional ───────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setUi((p) => ({ ...p, loading: true, error: "" }));

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email.trim(),
          password: data.password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Credenciales incorrectas");
      }

      const payload = JSON.parse(atob(json.accessToken.split(".")[1]));
      login({
        user: {
          id: payload.id,
          name: json.name,
          email: json.email,
          role: json.role,
        },
        token: json.accessToken,
      });

      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detectedTz) {
        fetch("/api/employee/me", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${json.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ timezone: detectedTz }),
        }).catch(() => { });
      }

      // Redirección por rol
      router.push(
        json.role === "ADMIN" ? "/admin/dashboard" : "/employee/dashboard",
      );
    } catch (err) {
      setUi((p) => ({
        ...p,
        error: err instanceof Error ? err.message : "Error de conexión",
      }));
    } finally {
      setUi((p) => ({ ...p, loading: false }));
    }
  };

  /* ── UI ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex">
      {/* Panel Izquierdo */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-center items-center overflow-hidden">
        <SafeImage src={ui.assets.bg} alt="" fill className="object-cover" />
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
          <h2 className="mb-8 text-center font-black text-[#040626] text-2xl uppercase tracking-tight" style={{ fontFamily: FONTS.title }}>
            LOGIN
          </h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className={CLASSES.label} style={{ fontFamily: FONTS.body }}>Email</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                className={CLASSES.input}
                style={{ fontFamily: FONTS.body }}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className={CLASSES.label} style={{ fontFamily: FONTS.body }}>Contraseña</label>
              <div className="relative">
                <input
                  type={ui.showPass ? "text" : "password"}
                  value={data.password}
                  onChange={(e) =>
                    setData({ ...data, password: e.target.value })
                  }
                  className={CLASSES.input}
                  style={{ fontFamily: FONTS.body }}
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setUi((p) => ({ ...p, showPass: !p.showPass }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <EyeIcon open={ui.showPass} />
                </button>
              </div>
            </div>

            {/* Error */}
            {ui.error && <div className="text-red-500 text-sm" style={{ fontFamily: FONTS.body }}>{ui.error}</div>}

            {/* Forgot password */}
            <div className="text-right -mt-2">
              <Link
                href="/forgot-password"
                className="text-xs text-gray-500 hover:text-[#FF003B] transition-colors"
                style={{ fontFamily: FONTS.body }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={ui.loading}
              className="py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#040626] to-[#FF003B]"
              style={{ fontFamily: FONTS.title }}
            >
              {ui.loading ? "Cargando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
