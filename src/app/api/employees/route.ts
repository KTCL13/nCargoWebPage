import { NextRequest } from 'next/server'
import { employeeController } from '@/modules/employees/controllers/employee.controller'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    return employeeController.findOne(req)
  }

  return employeeController.findAll(req)
}

export async function POST(req: NextRequest) {
  return employeeController.create(req)
}

export async function PUT(req: NextRequest) {
  return employeeController.update(req)
}

export async function DELETE(req: NextRequest) {
  return employeeController.remove(req)
}