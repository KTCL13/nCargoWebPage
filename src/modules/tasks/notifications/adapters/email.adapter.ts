import { Resend, CreateEmailOptions, CreateEmailResponse } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM ?? 'N-Cargo <onboarding@resend.dev>'

async function send(payload: CreateEmailOptions): Promise<void> {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY no está configurada')
    }
    const result: CreateEmailResponse = await resend.emails.send(payload)
    if (result.error) {
        const { name, message } = result.error
        throw new Error(`Resend rechazó el envío a ${payload.to} (${name}): ${message}`)
    }
}

class EmailAdapter {
    async sendTaskAssigned(to: string, employeeName: string, taskTitle: string): Promise<void> {
        await send({
            from: FROM,
            to,
            subject: `Nueva tarea asignada: ${taskTitle}`,
            html: `
                <h2>Hola, ${employeeName}</h2>
                <p>Se te ha asignado una nueva tarea: <strong>${taskTitle}</strong>.</p>
                <p>Ingresa a la plataforma para ver los detalles.</p>
            `,
        })
    }

    async sendTaskReassigned(to: string, employeeName: string, taskTitle: string): Promise<void> {
        await send({
            from: FROM,
            to,
            subject: `Tarea reasignada: ${taskTitle}`,
            html: `
                <h2>Hola, ${employeeName}</h2>
                <p>Se te ha reasignado la siguiente tarea: <strong>${taskTitle}</strong>.</p>
                <p>Ingresa a la plataforma para ver los detalles.</p>
            `,
        })
    }

    async sendTaskNotDoneWarningToAdmin(
        to: string,
        adminName: string,
        taskTitle: string,
        employeeName: string,
    ): Promise<void> {
        await send({
            from: FROM,
            to,
            subject: `Alerta: Tarea no completada — ${taskTitle}`,
            html: `
                <h2>Hola, ${adminName}</h2>
                <p>La tarea <strong>${taskTitle}</strong> asignada a <strong>${employeeName}</strong> no fue iniciada y su fecha límite ha expirado.</p>
                <p>El estado ha sido marcado como <strong>NO REALIZADA</strong>.</p>
            `,
        })
    }
}

export const emailAdapter = new EmailAdapter()
