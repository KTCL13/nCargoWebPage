export type FilterEmployeeDto = {
    status?: 'ACTIVE' | 'INACTIVE'  // Filtrar por estado del empleado
    roleId?: number  // Filtrar por ID de rol
    search?: string  // Buscar por nombre o correo
    page?: number    // Número de página (para paginación)
    limit?: number   // Límite de resultados por página
}