const ODOO_URL = process.env.ODOO_URL ?? ''
const ODOO_DB = process.env.ODOO_DB ?? ''
const ODOO_USERNAME = process.env.ODOO_USERNAME ?? ''
const ODOO_API_KEY = process.env.ODOO_API_KEY ?? ''

let cachedUid: number | null = null

type JsonRpcResponse<T> = {
  jsonrpc: '2.0'
  id: number
  result?: T
  error?: { code: number; message: string; data?: { name?: string; message?: string; debug?: string } }
}

async function jsonRpc<T>(service: string, method: string, args: unknown[]): Promise<T> {
  if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !ODOO_API_KEY) {
    throw new Error('Odoo no está configurado: revisa ODOO_URL, ODOO_DB, ODOO_USERNAME y ODOO_API_KEY en .env')
  }

  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { service, method, args },
      id: Date.now(),
    }),
  })

  if (!res.ok) throw new Error(`Odoo HTTP ${res.status}`)
  const data = (await res.json()) as JsonRpcResponse<T>
  if (data.error) {
    const msg = data.error.data?.message || data.error.message || 'Error en Odoo'
    throw new Error(msg)
  }
  if (data.result === undefined) throw new Error('Respuesta vacía de Odoo')
  return data.result
}

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

let cachedShippingProductId: number | null = null

export async function getShippingProductId(): Promise<number> {
  if (cachedShippingProductId) return cachedShippingProductId

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

  cachedShippingProductId = ids[0]
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
