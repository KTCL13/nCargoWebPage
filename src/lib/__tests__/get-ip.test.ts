/// <reference types="jest" />

import { getIp } from '../get-ip'

function makeReq(headers: Record<string, string>) {
    return {
        headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    } as any
}

describe('getIp', () => {
    it('G1 prefers the first IP from x-forwarded-for', () => {
        expect(getIp(makeReq({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }))).toBe('1.1.1.1')
    })

    it('G2 falls back to x-real-ip when forwarded-for is missing', () => {
        expect(getIp(makeReq({ 'x-real-ip': '3.3.3.3' }))).toBe('3.3.3.3')
    })

    it('G3 returns "unknown" when no IP headers are present', () => {
        expect(getIp(makeReq({}))).toBe('unknown')
    })

    it('G4 trims whitespace around the first forwarded IP', () => {
        expect(getIp(makeReq({ 'x-forwarded-for': '   4.4.4.4   , 5.5.5.5' }))).toBe('4.4.4.4')
    })
})
