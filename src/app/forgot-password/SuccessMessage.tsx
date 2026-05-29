'use client'

import Link from "next/link";

export default function SuccessMessage() {
  return (
    <div className="text-center space-y-6">
      <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-sm text-green-800 font-subtitles">
        Si el email está registrado, recibirás un enlace en tu bandeja de entrada.
      </div>
      <Link
        href="/login"
        className="inline-block text-sm font-bold font-subtitles text-[var(--color-nc-dark)] hover:text-[var(--color-nc-red)] transition-colors"
      >
        ← Volver al login
      </Link>
    </div>
  );
}
