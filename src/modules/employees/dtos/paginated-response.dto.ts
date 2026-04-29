import { EmployeeResponseDto } from './employee-response.dto'

export type PaginatedResponseDto = {
    data: EmployeeResponseDto[]  // Array de empleados
    total: number  // Total de empleados
    page: number   // Página actual
    limit: number  // Límite de empleados por página
}