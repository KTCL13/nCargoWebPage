import Image from "next/image";
import ForgotPasswordClient from "./ForgotPasswordClient";

/* ── Tipos y Constantes ───────────────────────────────────────────── */
export const FONTS = {
  title: "'League Spartan', sans-serif",
  body: "'Poppins', sans-serif",
} as const;

export const metadata = {
  title: "Recuperar Contraseña | N-Cargo",
  description: "Recupera tu contraseña de N-Cargo",
  robots: {
    index: true,
    follow: true,
  },
};

const SafeImage = ({ src, fill, ...props }: any) =>
  src ? (
    <Image src={src} fill={fill} sizes="(max-width: 1024px) 100vw, 55vw" {...props} />
  ) : (
    <div
      {...props}
      className={`bg-gradient-to-br from-[#040626] to-[#FF003B] ${props.className || ""}`}
    />
  );

export default function ForgotPasswordPage() {
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

          <ForgotPasswordClient />
        </div>
      </main>
    </div>
  )
}
