import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'N-Cargo <noreply@ncargo.app>'

class EmailAdapter {
    async sendTaskAssigned(to: string, employeeName: string, taskTitle: string): Promise<void> {
        await resend.emails.send({
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
        await resend.emails.send({
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
        await resend.emails.send({
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
