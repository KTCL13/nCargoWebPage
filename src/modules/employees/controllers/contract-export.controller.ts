import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthEmployee } from '@/lib/auth-guard'
import { generateContractExcel, generateContractPDF } from '../services/contract-export.service'
import { fullName } from '../services/employee.service'

class ContractExportController {
  async export(req: NextRequest): Promise<NextResponse> {
    try {
      // Auth guard
      await getAuthEmployee(req)

      const body = await req.json() as {
        employeeId: number
        format: 'xlsx' | 'pdf'
        generatedBy: number
      }

      const { employeeId, format, generatedBy } = body

      if (!employeeId || !format || !generatedBy) {
        return NextResponse.json(
          { message: 'employeeId, format and generatedBy are required' },
          { status: 400 },
        )
      }

      if (format !== 'xlsx' && format !== 'pdf') {
        return NextResponse.json(
          { message: "format must be 'xlsx' or 'pdf'" },
          { status: 400 },
        )
      }

      // ── fetch employee ────────────────────────────────────────────────
      const employee = await prisma.employee.findUnique({ where: { id: employeeId } })
      if (!employee) {
        return NextResponse.json({ message: 'Employee not found' }, { status: 404 })
      }
      const empName = fullName(employee)

      // ── fetch contracts with relations ────────────────────────────────
      const contracts = await prisma.contract.findMany({
        where: { employeeId },
        include: {
          job: true,
          contractType: true,
        },
        orderBy: { startDate: 'desc' },
      })

      // ── map to export rows (convert Prisma Decimal → number) ──────────
      const exportRows = contracts.map(c => ({
        id:           c.id,
        job:          { title: c.job.title },
        contractType: { name: c.contractType.name },
        salary:       c.salary != null ? Number(c.salary) : null,
        hourlyRate:   c.hourlyRate != null ? Number(c.hourlyRate) : null,
        startDate:    c.startDate,
        endDate:      c.endDate,
        isActive:     c.isActive,
      }))

      // ── generate file ─────────────────────────────────────────────────
      let buffer: Buffer
      let mimeType: string
      let ext: string

      if (format === 'xlsx') {
        buffer = await generateContractExcel(empName, exportRows)
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ext = 'xlsx'
      } else {
        buffer = await generateContractPDF(empName, exportRows)
        mimeType = 'application/pdf'
        ext = 'pdf'
      }

      // ── save record to generated_documents ───────────────────────────
      const timestamp = Date.now()
      const fileName = `contrato_historial_${employeeId}_${timestamp}.${ext}`
      const fileUrl = `/exports/${fileName}`

      await prisma.generatedDocument.create({
        data: {
          employeeId,
          type: 'CONTRATO',
          fileUrl,
          metadata: {
            format,
            contractCount: contracts.length,
            fileName,
          },
          generatedBy,
        },
      })

      // ── stream file back ──────────────────────────────────────────────
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': String(buffer.length),
        },
      })
    } catch (error: unknown) {
      return NextResponse.json(
        { message: error instanceof Error ? error.message : 'Error interno del servidor' },
        { status: 400 },
      )
    }
  }
}

export const contractExportController = new ContractExportController()
