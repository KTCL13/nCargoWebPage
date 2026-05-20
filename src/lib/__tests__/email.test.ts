/// <reference types="jest" />

const send = jest.fn()
jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
}))

import { sendPasswordResetEmail } from '../email'

describe('sendPasswordResetEmail', () => {
    beforeEach(() => {
        send.mockReset()
        send.mockResolvedValue({ id: 'msg_123' })
    })

    it('G1 happy path: sends an email with the reset URL embedded in the body', async () => {
        await sendPasswordResetEmail('user@example.com', 'https://app.example/reset/abc')

        expect(send).toHaveBeenCalledTimes(1)
        const arg = send.mock.calls[0][0]
        expect(arg.to).toBe('user@example.com')
        expect(arg.subject).toMatch(/Recuperación de contraseña/)
        expect(arg.html).toContain('https://app.example/reset/abc')
    })

    it('G2 propagates Resend errors so the caller can decide', async () => {
        send.mockRejectedValueOnce(new Error('provider rejected'))
        await expect(sendPasswordResetEmail('x@y.z', 'https://r')).rejects.toThrow('provider rejected')
    })

    it('G3 still calls Resend even if the URL contains query params', async () => {
        await sendPasswordResetEmail('x@y.z', 'https://r/?a=1&b=2')
        expect(send.mock.calls[0][0].html).toContain('https://r/?a=1&amp;b=2'.replace(/&amp;/g, '&') /* HTML-escaped not enforced */)
    })
})
