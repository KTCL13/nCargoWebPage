import { authFetch } from './auth-fetch'

export const employeeClient = {
  async getProfile(token: string) {
    const res = await authFetch("/api/employee/me", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Error obteniendo perfil")
    return res.json()
  },
  
  async updateProfile(data: { firstName: string, lastName: string, timezone: string }, token: string) {
    const res = await authFetch("/api/employee/me", {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify(data)
    })
    
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || "Error al actualizar perfil")
    }
    
    return res.json()
  }
}
