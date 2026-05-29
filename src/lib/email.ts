import { Resend } from 'resend'
import { withRetry } from '@/lib/retry'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM ?? 'N-Cargo <noreply@updates.ncargousa.com>'

const TIMEOUT_MS = 10_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    let timer!: ReturnType<typeof setTimeout>
    const timeout = new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    })
    return Promise.race([
        promise.then(
            v => { clearTimeout(timer); return v },
            e => { clearTimeout(timer); throw e },
        ),
        timeout,
    ])
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
    await withRetry(async () => {
        const send = resend.emails.send({
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

        const result = await withTimeout(send, TIMEOUT_MS, 'Resend')
        if (result.error) {
            throw new Error(`Resend error: ${result.error.message}`)
        }
    })
}
