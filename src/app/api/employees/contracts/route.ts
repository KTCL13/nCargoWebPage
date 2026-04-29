import { NextRequest } from 'next/server'
import { employeeController } from '@/modules/employees/controllers/employee.controller'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)

    if (searchParams.get('contractId')) {
        return employeeController.findContractById(req)
    }

    return employeeController.getContracts(req)
}

export async function POST(req: NextRequest) {
    return employeeController.createContract(req)
}

export async function PUT(req: NextRequest) {
    return employeeController.updateContract(req)
}
