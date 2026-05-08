import { NextRequest } from 'next/server'
import { employeeController } from '@/modules/employees/controllers/employee.controller'

export async function GET(req: NextRequest) {
    return employeeController.checkDuplicates(req)
}
