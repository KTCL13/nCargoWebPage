import { AuthFormCard } from "@/components/ui/AuthFormCard"
import ForgotPasswordClient from "./ForgotPasswordClient"

export const metadata = {
  title: "Recuperar Contraseña | N-Cargo",
  description: "Recupera tu contraseña de N-Cargo",
  robots: { index: true, follow: true },
}

export default function ForgotPasswordPage() {
  return (
    <AuthFormCard
      title="RECUPERAR CONTRASEÑA"
      subtitle="Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña."
    >
      <ForgotPasswordClient />
    </AuthFormCard>
  )
}
