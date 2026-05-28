import { withRetry } from '@/lib/retry'

const ODOO_DB = process.env.ODOO_DB ?? ''
const ODOO_USERNAME = process.env.ODOO_USERNAME ?? ''
const ODOO_API_KEY = process.env.ODOO_API_KEY ?? ''

const TIMEOUT_MS = 10_000

// Force HTTPS — Odoo SaaS instances enforce HTTPS with 307 redirects; Node fetch
// resends POST bodies on 307 but some proxies strip them, so we upgrade proactively.
function odooUrl(path: string): string {
  const raw = process.env.ODOO_URL ?? ''
  if (!raw) throw new Error('ODOO_URL no configurado en .env')
  const base = /^http:\/\/(?!localhost|127\.0\.0\.1)/i.test(raw)
    ? raw.replace(/^http:/i, 'https:')
    : raw
  return `${base.replace(/\/$/, '')}${path}`
}

type JsonRpcResponse<T> = {
  jsonrpc: '2.0'
  id: number
  result?: T
  error?: { code: number; message: string; data?: { name?: string; message?: string; debug?: string } }
}

async function jsonRpcOnce<T>(service: string, method: string, args: unknown[]): Promise<T> {
  if (!ODOO_DB || !ODOO_USERNAME || !ODOO_API_KEY) {
    throw new Error('Odoo no está configurado: revisa ODOO_URL, ODOO_DB, ODOO_USERNAME y ODOO_API_KEY en .env')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(odooUrl('/jsonrpc'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: { service, method, args },
        id: Date.now(),
      }),
    })

    if (!res.ok) {
      const detail = res.status === 307 || res.status === 301 || res.status === 302
        ? ` — verifica que ODOO_URL use https://`
        : ''
      throw new Error(`Odoo HTTP ${res.status}${detail}`)
    }
    const data = (await res.json()) as JsonRpcResponse<T>
    if (data.error) {
      const msg = data.error.data?.message || data.error.message || 'Error en Odoo'
      throw new Error(msg)
    }
    if (data.result === undefined) throw new Error('Respuesta vacía de Odoo')
    return data.result
  } finally {
    clearTimeout(timer)
  }
}

async function jsonRpc<T>(service: string, method: string, args: unknown[]): Promise<T> {
  return withRetry(() => jsonRpcOnce<T>(service, method, args))
}

// uid is the user's DB row id for a given (db, username, api_key) triple — it never
// changes unless the employee record is deleted, so a per-process cache is safe.
let cachedUid: number | null = null

async function authenticate(): Promise<number> {
  if (cachedUid) return cachedUid
  const uid = await jsonRpc<number | false>('common', 'authenticate', [
    ODOO_DB,
    ODOO_USERNAME,
    ODOO_API_KEY,
    {},
  ])
  if (!uid) throw new Error('Autenticación fallida con Odoo')
  cachedUid = uid
  return uid
}

export async function executeKw<T>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  const uid = await authenticate()
  return jsonRpc<T>('object', 'execute_kw', [
    ODOO_DB,
    uid,
    ODOO_API_KEY,
    model,
    method,
    args,
    kwargs,
  ])
}

export type OdooPartner = {
  id: number
  name: string
  vat: string | false
  email: string | false
  phone: string | false
}

export async function searchPartners(query: string, limit = 20): Promise<OdooPartner[]> {
  const words = query.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  // Build OR domain across name/email/vat for each word (matches Python script intent
  // of fuzzy lookup, plus extends to email/vat which the UI also searches by).
  const wordDomains = words.map(w => [
    '|', '|',
    ['name', 'ilike', w],
    ['email', 'ilike', w],
    ['vat', 'ilike', w],
  ])
  const domain: unknown[] = [...Array(words.length - 1).fill('&'), ...wordDomains.flat()]

  const partners = await executeKw<OdooPartner[]>(
    'res.partner',
    'search_read',
    [domain],
    { fields: ['id', 'name', 'vat', 'email', 'phone'], limit },
  )

  return partners
}

export async function getShippingProductId(): Promise<number> {
  const code = process.env.ODOO_SHIPPING_PRODUCT_CODE?.trim()
  if (!code) {
    throw new Error('ODOO_SHIPPING_PRODUCT_CODE no configurado en .env')
  }

  const ids = await executeKw<number[]>(
    'product.product',
    'search',
    [[['default_code', '=', code]]],
    { limit: 1 },
  )

  if (!ids.length) {
    throw new Error(`No se encontró producto con referencia interna "${code}" en Odoo`)
  }

  return ids[0]
}

export type CreateQuoteLine = {
  description: string
  quantity: number
  priceUnit: number
}

export async function createSaleOrder(
  partnerId: number,
  productId: number,
  line: CreateQuoteLine,
): Promise<{ orderId: number; name: string; total: number }> {
  const orderId = await executeKw<number>('sale.order', 'create', [
    { partner_id: partnerId, state: 'draft' },
  ])

  await executeKw<number>('sale.order.line', 'create', [
    {
      order_id: orderId,
      product_id: productId,
      name: line.description,
      product_uom_qty: line.quantity,
      price_unit: line.priceUnit,
    },
  ])

  const [order] = await executeKw<Array<{ name: string; amount_total: number }>>(
    'sale.order',
    'read',
    [[orderId]],
    { fields: ['name', 'amount_total'] },
  )

  return { orderId, name: order.name, total: order.amount_total }
}
