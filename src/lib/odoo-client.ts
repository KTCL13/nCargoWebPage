import xmlrpc from 'xmlrpc'

type XmlRpcValue =
  | string
  | number
  | boolean
  | null
  | XmlRpcValue[]
  | { [key: string]: XmlRpcValue }

export interface OdooTask {
  id: number
  name: string
  description: string
  stage_id: [number, string] | false
  user_ids: number[]
  partner_id: [number, string] | false
}

export interface OdooProject {
  id: number
  name: string
  partner_id: [number, string] | false
  user_id: [number, string] | false
}

export interface OdooStage {
  id: number
  name: string
  sequence: number
}

function makeClient(path: string) {
  const url = new URL(process.env.ODOO_URL!)
  const isHttps = url.protocol === 'https:'
  const host = url.hostname
  const port = url.port ? parseInt(url.port) : isHttps ? 443 : 80

  const opts = { host, port, path }
  return isHttps ? xmlrpc.createSecureClient(opts) : xmlrpc.createClient(opts)
}

function call<T>(client: ReturnType<typeof xmlrpc.createClient>, method: string, params: XmlRpcValue[]): Promise<T> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.methodCall(method, params, (err: any, value: T) => {
      if (err) reject(err instanceof Error ? err : new Error(String(err)))
      else resolve(value)
    })
  })
}

async function authenticate(): Promise<number> {
  const common = makeClient('/xmlrpc/2/common')
  const uid = await call<number>(common, 'authenticate', [
    process.env.ODOO_DB!,
    process.env.ODOO_USERNAME!,
    process.env.ODOO_API_KEY!,
    {},
  ])
  if (!uid) throw new Error('Odoo authentication failed — check ODOO_* env vars')
  return uid
}

// Odoo execute_kw(db, uid, key, model, method, args, kwargs)
// args is passed as-is — for search_read it must be [domain]
async function executeKw<T>(
  uid: number,
  model: string,
  method: string,
  args: XmlRpcValue[],
  kwargs: Record<string, XmlRpcValue> = {},
): Promise<T> {
  const models = makeClient('/xmlrpc/2/object')
  return call<T>(models, 'execute_kw', [
    process.env.ODOO_DB!,
    uid,
    process.env.ODOO_API_KEY!,
    model,
    method,
    args,
    kwargs,
  ])
}

/**
 * Search Odoo projects by name.
 * If searchTerm is provided, filters by `name ilike searchTerm`.
 * If empty or omitted, returns ALL projects (use with care on large instances).
 */
export async function searchLockerProjects(searchTerm?: string): Promise<OdooProject[]> {
  const uid = await authenticate()
  // domain is the first positional arg for search_read → args = [domain]
  const domain: XmlRpcValue[] = searchTerm
    ? [['name', 'ilike', searchTerm]]
    : []
  return executeKw<OdooProject[]>(uid, 'project.project', 'search_read',
    [domain],
    { fields: ['id', 'name', 'partner_id', 'user_id'] },
  )
}

export async function getTasksByProject(projectId: number): Promise<OdooTask[]> {
  const uid = await authenticate()
  return executeKw<OdooTask[]>(uid, 'project.task', 'search_read',
    [[['project_id', '=', projectId]]],
    { fields: ['id', 'name', 'description', 'stage_id', 'user_ids', 'partner_id'] },
  )
}

export async function getProjectStages(projectId: number): Promise<OdooStage[]> {
  const uid = await authenticate()
  return executeKw<OdooStage[]>(uid, 'project.task.type', 'search_read',
    [[['project_ids', 'in', [projectId]]]],
    { fields: ['id', 'name', 'sequence'], order: 'sequence asc' },
  )
}

export async function updateTaskStage(taskId: number, stageId: number): Promise<boolean> {
  const uid = await authenticate()
  return executeKw<boolean>(uid, 'project.task', 'write',
    [[taskId], { stage_id: stageId }],
  )
}

export async function findStageByName(projectId: number, stageName: string): Promise<OdooStage | undefined> {
  const stages = await getProjectStages(projectId)
  return stages.find(s => s.name.toLowerCase() === stageName.toLowerCase())
}

export async function createTask(projectId: number, name: string, description?: string): Promise<number> {
  const uid = await authenticate()
  const vals: Record<string, XmlRpcValue> = { project_id: projectId, name }
  if (description) vals.description = description
  return executeKw<number>(uid, 'project.task', 'create', [vals])
}

export async function addTaskComment(taskId: number, comment: string): Promise<number> {
  const uid = await authenticate()
  return executeKw<number>(uid, 'project.task', 'message_post',
    [[taskId]],
    { body: comment, message_type: 'comment' }
  )
}
