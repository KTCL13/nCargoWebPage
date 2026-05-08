import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM ?? 'N-Cargo <noreply@updates.ncargousa.com>'

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
    await resend.emails.send({
        from: FROM,
        to,
        subject: 'Recuperación de contraseña — N-Cargo',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #040626;">Restablecer contraseña</h2>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en N-Cargo.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#FF003B;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
            Crear nueva contraseña
          </a>
        </p>
        <p style="color:#666;font-size:13px;">Este enlace expira en 1 hora. Si no solicitaste esto, puedes ignorar este email.</p>
      </div>
    `,
    })
}
