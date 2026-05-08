import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

export type ContractExportRow = {
  id: number
  job: { title: string }
  contractType: { name: string }
  salary: number | null
  hourlyRate: number | null
  startDate: Date | string
  endDate: Date | string | null
  isActive: boolean
}

// ─── helpers ───────────────────────────────────────────────────────────────

function fmtDate(d: Date | string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function fmtMoney(v: number | null): string {
  if (v == null) return '—'
  return `$${Number(v).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
}

// ─── palette ───────────────────────────────────────────────────────────────

const DARK = '040626'
const RED = 'FF003B'
const ROW_ALT = 'F5F7FA'

// ─── Excel ─────────────────────────────────────────────────────────────────

export async function generateContractExcel(
  employeeName: string,
  contracts: ContractExportRow[],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'N-Cargo'

  const ws = wb.addWorksheet('Historial de Contratos', {
    pageSetup: { orientation: 'landscape', fitToPage: true },
  })

  // ── column widths ────────────────────────────────────────────────────
  ws.columns = [
    { key: 'id',    width: 8  },
    { key: 'job',   width: 30 },
    { key: 'type',  width: 20 },
    { key: 'sal',   width: 16 },
    { key: 'rate',  width: 16 },
    { key: 'start', width: 14 },
    { key: 'end',   width: 14 },
    { key: 'est',   width: 12 },
  ]

  // ── banner header (row 1, merged A–H) ────────────────────────────────
  ws.mergeCells('A1:H1')
  const banner = ws.getCell('A1')
  banner.value = 'HISTORIAL DE CONTRATOS'
  banner.font = { name: 'Arial', bold: true, size: 20, color: { argb: 'FFFFFFFF' } }
  banner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK}` } }
  banner.alignment = { vertical: 'middle', horizontal: 'left', indent: 2 }
  ws.getRow(1).height = 48

  // Red left border accent on A1
  ws.getCell('A1').border = {
    left: { style: 'thick', color: { argb: `FF${RED}` } },
  }

  // ── employee / date row (row 2) ───────────────────────────────────────
  ws.mergeCells('A2:E2')
  const empCell = ws.getCell('A2')
  empCell.value = employeeName
  empCell.font = { name: 'Arial', bold: true, size: 11 }
  empCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 2 }

  ws.mergeCells('F2:H2')
  const dateCell = ws.getCell('F2')
  dateCell.value = `Generado: ${fmtDate(new Date())}`
  dateCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF888888' } }
  dateCell.alignment = { vertical: 'middle', horizontal: 'right' }
  ws.getRow(2).height = 22

  // ── table header row (row 3) ──────────────────────────────────────────
  const HEADERS = ['#', 'Cargo', 'Tipo', 'Salario', 'Tarifa/h', 'Inicio', 'Fin', 'Estado']
  const headerRow = ws.getRow(3)
  headerRow.height = 24

  HEADERS.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK}` } }
    cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'center' : 'left', indent: i === 0 ? 0 : 1 }
    cell.border = {
      bottom: { style: 'medium', color: { argb: `FF${RED}` } },
    }
  })

  // ── data rows ─────────────────────────────────────────────────────────
  contracts.forEach((c, idx) => {
    const rowIdx = 4 + idx
    const row = ws.getRow(rowIdx)
    row.height = 20

    const isAlt = idx % 2 === 1
    const bg = isAlt ? `FF${ROW_ALT}` : 'FFFFFFFF'

    const values = [
      c.id,
      c.job.title,
      c.contractType.name,
      fmtMoney(c.salary),
      fmtMoney(c.hourlyRate),
      fmtDate(c.startDate),
      fmtDate(c.endDate),
      c.isActive ? 'Activo' : 'Inactivo',
    ]

    values.forEach((v, colIdx) => {
      const cell = row.getCell(colIdx + 1)
      cell.value = v
      cell.font = { name: 'Arial', size: 10 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
      cell.alignment = {
        vertical: 'middle',
        horizontal: colIdx === 0 ? 'center' : 'left',
        indent: colIdx === 0 ? 0 : 1,
      }

      // Estado badge
      if (colIdx === 7) {
        if (c.isActive) {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF166534' } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }
        } else {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF991B1B' } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } }
        }
      }

      // Tipo badge
      if (colIdx === 2) {
        const name = c.contractType.name.toUpperCase()
        if (name.includes('MENSUAL') || name.includes('FIJO')) {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E40AF' } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }
        } else if (name.includes('HORA') || name.includes('POR_HORA')) {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF92400E' } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } }
        }
      }
    })
  })

  // ── summary row ───────────────────────────────────────────────────────
  const summaryRowIdx = 4 + contracts.length
  const summaryRow = ws.getRow(summaryRowIdx)
  summaryRow.height = 20

  const active = contracts.filter(c => c.isActive).length

  ws.mergeCells(`A${summaryRowIdx}:E${summaryRowIdx}`)
  const sumCell1 = summaryRow.getCell(1)
  sumCell1.value = `Total de contratos: ${contracts.length}`
  sumCell1.font = { name: 'Arial', size: 10, bold: true }
  sumCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } }
  sumCell1.alignment = { indent: 1 }

  ws.mergeCells(`F${summaryRowIdx}:H${summaryRowIdx}`)
  const sumCell2 = summaryRow.getCell(6)
  sumCell2.value = `Activos: ${active}`
  sumCell2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF166534' } }
  sumCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }
  sumCell2.alignment = { horizontal: 'right' }

  // ── footer ────────────────────────────────────────────────────────────
  const footerRowIdx = summaryRowIdx + 2
  ws.mergeCells(`A${footerRowIdx}:H${footerRowIdx}`)
  const footer = ws.getCell(`A${footerRowIdx}`)
  footer.value = 'N-Cargo © 2026 — Documento generado automáticamente'
  footer.font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF888888' } }
  footer.alignment = { horizontal: 'center' }

  const raw = await wb.xlsx.writeBuffer()
  return Buffer.from(raw)
}

// ─── PDF ───────────────────────────────────────────────────────────────────

export async function generateContractPDF(
  employeeName: string,
  contracts: ContractExportRow[],
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 18 * 2.835, right: 18 * 2.835, bottom: 18 * 2.835, left: 18 * 2.835 },
      bufferPages: true,
    })

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const M = 18 * 2.835  // 18mm in pt
    const PAGE_W = doc.page.width
    const CONTENT_W = PAGE_W - M * 2

    // ── dark banner ──────────────────────────────────────────────────────
    const BANNER_H = 56
    doc.rect(0, 0, PAGE_W, BANNER_H).fill(`#${DARK}`)

    // Red accent line (vertical separator ~75% from left)
    const accentX = PAGE_W - M - 60
    doc.moveTo(accentX, 8).lineTo(accentX, BANNER_H - 8).lineWidth(2).strokeColor(`#${RED}`).stroke()

    // Title
    doc.fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('HISTORIAL DE CONTRATOS', M, 16, { align: 'left', width: accentX - M - 10 })

    // N-CARGO right
    doc.fillColor(`#${RED}`)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('N-CARGO', accentX + 10, 20, { align: 'left', width: 60 })

    let y = BANNER_H + 14

    // ── meta row ─────────────────────────────────────────────────────────
    doc.fillColor('#111111')
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(employeeName, M, y)

    doc.fillColor('#888888')
      .font('Helvetica-Oblique')
      .fontSize(9)
      .text(`Generado: ${fmtDate(new Date())}`, M, y, { align: 'right', width: CONTENT_W })

    y += 28

    // ── table ─────────────────────────────────────────────────────────────
    // Red left accent
    doc.rect(M, y, 3, 20).fill(`#${RED}`)

    // Header row background
    doc.rect(M + 3, y, CONTENT_W - 3, 20).fill(`#${DARK}`)

    const cols = [
      { label: '#',       w: 32,  align: 'center' as const },
      { label: 'Cargo',   w: 120, align: 'left'   as const },
      { label: 'Tipo',    w: 70,  align: 'left'   as const },
      { label: 'Salario', w: 65,  align: 'left'   as const },
      { label: 'Inicio',  w: 55,  align: 'left'   as const },
      { label: 'Fin',     w: 55,  align: 'left'   as const },
      { label: 'Estado',  w: 50,  align: 'center' as const },
    ]

    // Header text
    let cx = M + 3 + 4
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5)
    cols.forEach(col => {
      doc.text(col.label, cx, y + 6, { width: col.w, align: col.align })
      cx += col.w
    })

    // Red bottom border under header
    doc.moveTo(M + 3, y + 20).lineTo(PAGE_W - M, y + 20).lineWidth(1.5).strokeColor(`#${RED}`).stroke()

    y += 20

    // Data rows
    const ROW_H = 18
    contracts.forEach((c, idx) => {
      const isAlt = idx % 2 === 1
      const rowBg = isAlt ? `#${ROW_ALT}` : '#FFFFFF'

      // Red left accent
      doc.rect(M, y, 3, ROW_H).fill(`#${RED}`)

      // Row background
      doc.rect(M + 3, y, CONTENT_W - 3, ROW_H).fill(rowBg)

      cx = M + 3 + 4
      doc.fillColor('#222222').font('Helvetica').fontSize(8)

      const rowValues: { value: string; col: typeof cols[0]; isState?: boolean; isType?: boolean }[] = [
        { value: String(c.id),            col: cols[0] },
        { value: c.job.title,             col: cols[1] },
        { value: c.contractType.name,     col: cols[2], isType: true },
        { value: fmtMoney(c.salary),      col: cols[3] },
        { value: fmtDate(c.startDate),    col: cols[4] },
        { value: fmtDate(c.endDate),      col: cols[5] },
        { value: c.isActive ? 'Activo' : 'Inactivo', col: cols[6], isState: true },
      ]

      rowValues.forEach(({ value, col, isState, isType }) => {
        if (isState) {
          // Draw badge bg
          const badgeBg = c.isActive ? '#DCFCE7' : '#FEF2F2'
          const badgeFg = c.isActive ? '#166534' : '#991B1B'
          const bx = cx + 2
          const bw = col.w - 4
          doc.rect(bx, y + 3, bw, 12).fill(badgeBg)
          doc.fillColor(badgeFg).font('Helvetica-Bold').fontSize(7.5)
            .text(value, bx, y + 6, { width: bw, align: 'center' })
        } else if (isType) {
          const name = c.contractType.name.toUpperCase()
          let typeBg = '#F3F4F6'
          let typeFg = '#374151'
          if (name.includes('MENSUAL') || name.includes('FIJO')) {
            typeBg = '#EFF6FF'; typeFg = '#1E40AF'
          } else if (name.includes('HORA') || name.includes('POR_HORA')) {
            typeBg = '#FFF7ED'; typeFg = '#92400E'
          }
          doc.rect(cx + 1, y + 3, col.w - 2, 12).fill(typeBg)
          doc.fillColor(typeFg).font('Helvetica-Bold').fontSize(7.5)
            .text(value, cx + 1, y + 6, { width: col.w - 2, align: 'left' })
        } else {
          doc.fillColor('#222222').font('Helvetica').fontSize(8)
            .text(value, cx, y + 5, { width: col.w, align: col.align, lineBreak: false })
        }
        cx += col.w
      })

      y += ROW_H
    })

    // ── summary table ─────────────────────────────────────────────────────
    const active = contracts.filter(c => c.isActive).length
    y += 10

    doc.rect(M, y, CONTENT_W, 22).fill('#F3F4F6')
    doc.fillColor('#374151').font('Helvetica-Bold').fontSize(9)
      .text(`Total de contratos: ${contracts.length}`, M + 8, y + 7, { width: CONTENT_W / 2 })

    doc.rect(M + CONTENT_W / 2, y, CONTENT_W / 2, 22).fill('#DCFCE7')
    doc.fillColor('#166534').font('Helvetica-Bold').fontSize(9)
      .text(`Contratos activos: ${active}`, M + CONTENT_W / 2 + 8, y + 7, { width: CONTENT_W / 2 - 16 })

    y += 34

    // ── footer ────────────────────────────────────────────────────────────
    doc.fillColor('#AAAAAA').font('Helvetica-Oblique').fontSize(7.5)
      .text('N-Cargo © 2026 — Documento generado automáticamente', M, y, {
        width: CONTENT_W,
        align: 'center',
      })

    doc.end()
  })
}
