import { Resend, CreateEmailOptions, CreateEmailResponse } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM ?? 'N-Cargo <noreply@updates.ncargousa.com>'

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

    async sendTaskNotDoneToEmployee(to: string, employeeName: string, taskTitle: string): Promise<void> {
        await send({
            from: FROM,
            to,
            subject: `Tarea no completada: ${taskTitle}`,
            html: `
                <h2>Hola, ${employeeName}</h2>
                <p>Tu tarea <strong>${taskTitle}</strong> no fue completada dentro del plazo establecido y ha sido marcada como <strong>NO REALIZADA</strong>.</p>
                <p>Ingresa a la plataforma para más información.</p>
            `,
        })
    }

    async sendTaskDueSoonToEmployee(to: string, employeeName: string, taskTitle: string, endTime: Date): Promise<void> {
        const formatted = endTime.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        await send({
            from: FROM,
            to,
            subject: `⏰ Tu tarea vence pronto: ${taskTitle}`,
            html: `
                <h2>Hola, ${employeeName}</h2>
                <p>Tu tarea <strong>${taskTitle}</strong> vence el <strong>${formatted}</strong> (en menos de 1 hora).</p>
                <p>Ingresa a la plataforma y complétala a tiempo.</p>
            `,
        })
    }

    async sendTaskDueSoonToAdmin(to: string, adminName: string, taskTitle: string, employeeName: string, endTime: Date): Promise<void> {
        const formatted = endTime.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        await send({
            from: FROM,
            to,
            subject: `⏰ Tarea próxima a vencer: ${taskTitle}`,
            html: `
                <h2>Hola, ${adminName}</h2>
                <p>La tarea <strong>${taskTitle}</strong> asignada a <strong>${employeeName}</strong> vence el <strong>${formatted}</strong> (en menos de 1 hora).</p>
                <p>Ingresa a la plataforma para revisar el estado.</p>
            `,
        })
    }

    async sendTaskCancelled(to: string, employeeName: string, taskTitle: string, reason: string): Promise<void> {
        await send({
            from: FROM,
            to,
            subject: `Tarea cancelada: ${taskTitle}`,
            html: `
                <h2>Hola, ${employeeName}</h2>
                <p>La tarea <strong>${taskTitle}</strong> que tenías asignada ha sido <strong>cancelada y eliminada</strong> por un administrador.</p>
                <p><strong>Motivo:</strong> ${reason}</p>
                <p>Si tienes dudas, comunícate con tu administrador.</p>
            `,
        })
    }
}

export const emailAdapter = new EmailAdapter()
