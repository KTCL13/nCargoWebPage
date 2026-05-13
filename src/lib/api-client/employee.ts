export const employeeClient = {
  async getProfile() {
    const res = await fetch("/api/employee/me")
    if (!res.ok) throw new Error("Error obteniendo perfil")
    return res.json()
  },
  
  async updateProfile(data: { firstName: string, lastName: string, timezone: string }) {
    const res = await fetch("/api/employee/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
    
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || "Error al actualizar perfil")
    }
    
    return res.json()
  }
}
