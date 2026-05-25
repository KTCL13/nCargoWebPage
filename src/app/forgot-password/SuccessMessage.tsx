'use client'

import Link from "next/link";

const FONTS = {
  body: "'Poppins', sans-serif",
} as const;

export default function SuccessMessage() {
  return (
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
  );
}
