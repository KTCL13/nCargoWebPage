export const jornadaClient = {
  async getToday(token: string) {
    const res = await fetch(`/api/attendance/today?_=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error('Sesión expirada, inicia sesión nuevamente.')
      throw new Error('No se pudo cargar la jornada.')
    }
    return res.json()
  },

  async action(token: string, path: string) {
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store',
    })
    
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      const msg = (data && typeof data === 'object' && 'message' in data ? (data as { message: string }).message : '') || 'Error en la operación'
      throw new Error(msg)
    }
    return res.json()
  },

  async loadTasks(token: string, employeeId: number) {
    const [pendingRes, inProgressRes] = await Promise.all([
      fetch(`/api/tasks?employeeId=${employeeId}&status=PENDING&limit=50`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/tasks?employeeId=${employeeId}&status=IN_PROGRESS&limit=50`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
    const [pending, inProgress] = await Promise.all([
      pendingRes.ok ? pendingRes.json() : { data: [] },
      inProgressRes.ok ? inProgressRes.json() : { data: [] },
    ])
    return [
      ...(pending.data ?? pending ?? []),
      ...(inProgress.data ?? inProgress ?? []),
    ].map((t: any) => ({ id: t.id, title: t.title, status: t.status }))
  },

  async completeTask(token: string, taskId: number) {
    const res = await fetch(`/api/tasks?id=${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'COMPLETED', endTime: new Date() }),
    })
    if (!res.ok) throw new Error('Error al completar tarea')
    return res.json()
  }
}
