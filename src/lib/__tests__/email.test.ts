/// <reference types="jest" />

const send = jest.fn()
jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
}))

// Replace withRetry with a zero-delay version so tests run instantly.
// Retry behavior itself is fully covered in retry.test.ts.
jest.mock('../retry', () => ({
    withRetry: async (fn: () => Promise<unknown>) => fn(),
    isRetryable: jest.requireActual('../retry').isRetryable,
}))

import { sendPasswordResetEmail } from '../email'

describe('sendPasswordResetEmail', () => {
    beforeEach(() => send.mockReset())

    it('G1 happy path: sends an email with the reset URL embedded in the body', async () => {
        send.mockResolvedValue({ id: 'msg_123', error: null })

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

    it('G3 throws when Resend returns an error object in the response', async () => {
        send.mockResolvedValue({ id: null, error: { message: 'invalid recipient' } })
        await expect(sendPasswordResetEmail('x@y.z', 'https://r')).rejects.toThrow('invalid recipient')
    })

    it('G4 still calls Resend even if the URL contains query params', async () => {
        send.mockResolvedValue({ id: 'msg_456', error: null })
        await sendPasswordResetEmail('x@y.z', 'https://r/?a=1&b=2')
        expect(send.mock.calls[0][0].html).toContain('https://r/?a=1&b=2')
    })
})
