// src/components/ui/Pagination.tsx
'use client'

interface PaginationProps {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const pageCount = Math.ceil(totalItems / pageSize)

  if (totalItems === 0) return null

  const renderPageButtons = () => {
    const btnClass = (i: number) =>
      `w-8 h-8 flex items-center justify-center rounded-md text-sm font-subtitles transition shadow-sm ${
        page === i
          ? 'bg-[var(--color-nc-red)] text-white shadow-md'
          : 'text-[var(--color-nc-dark)] border border-gray-100 bg-white hover:border-[var(--color-nc-red)] hover:text-[var(--color-nc-red)]'
      }`

    const pageBtn = (i: number) => (
      <button key={i} onClick={() => onPageChange(i)} className={btnClass(i)}>
        {i + 1}
      </button>
    )

    const ellipsis = (key: string) => (
      <span key={key} className="w-8 h-8 flex items-center justify-center text-sm text-gray-400 select-none">
        …
      </span>
    )

    if (pageCount <= 11) {
      return Array.from({ length: pageCount }, (_, i) => pageBtn(i))
    }

    const buttons = []
    const windowStart = Math.max(1, page - 4)
    const windowEnd = Math.min(pageCount - 2, page + 4)

    buttons.push(pageBtn(0))
    if (windowStart > 1) buttons.push(ellipsis('el-start'))
    for (let i = windowStart; i <= windowEnd; i++) buttons.push(pageBtn(i))
    if (windowEnd < pageCount - 2) buttons.push(ellipsis('el-end'))
    buttons.push(pageBtn(pageCount - 1))

    return buttons
  }

  return (
    <nav aria-label="Paginación" className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full mt-4 bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
      {/* Navigation Controls — arriba en móvil */}
      <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
        <button
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold text-[var(--color-nc-dark)] border border-gray-100 hover:border-[var(--color-nc-red)] hover:text-[var(--color-nc-red)] disabled:opacity-30 disabled:pointer-events-none transition bg-white shadow-sm"
          title="Primera página"
        >
          «
        </button>
        <button
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="w-8 h-8 flex items-center justify-center rounded-md text-sm text-[var(--color-nc-dark)] border border-gray-100 hover:bg-gray-50 transition bg-white shadow-sm disabled:opacity-30 disabled:pointer-events-none"
        >
          ‹
        </button>

        {/* En móvil: solo página actual / total; en desktop: todos los botones */}
        <div className="hidden sm:flex items-center gap-1">
          {renderPageButtons()}
        </div>
        <span className="sm:hidden text-xs font-subtitles text-gray-600 px-2">
          {page + 1} / {Math.max(pageCount, 1)}
        </span>

        <button
          onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}
          disabled={page === pageCount - 1 || pageCount <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-md text-sm text-[var(--color-nc-dark)] border border-gray-100 hover:bg-gray-50 transition bg-white shadow-sm disabled:opacity-30 disabled:pointer-events-none"
        >
          ›
        </button>
        <button
          onClick={() => onPageChange(pageCount - 1)}
          disabled={page === pageCount - 1 || pageCount <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold text-[var(--color-nc-dark)] border border-gray-100 hover:border-[var(--color-nc-red)] hover:text-[var(--color-nc-red)] disabled:opacity-30 disabled:pointer-events-none transition bg-white shadow-sm"
          title="Última página"
        >
          »
        </button>
      </div>

      {/* Info + selector de tamaño — abajo en móvil */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 order-2 sm:order-1">
        <div className="flex items-center gap-1.5">
          <label htmlFor="registros-por-pagina" className="text-xs font-subtitles text-gray-500 whitespace-nowrap">Mostrar</label>
          <select
            id="registros-por-pagina"
            name="pageSize"
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value))
              onPageChange(0)
            }}
            className="text-xs font-subtitles px-2 py-1 rounded-md border border-gray-200 bg-white focus:border-[var(--color-nc-red)] outline-none cursor-pointer hover:border-gray-300 transition"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs font-subtitles text-gray-500 whitespace-nowrap">
          <span className="font-bold text-gray-700">{page * pageSize + 1}</span>–<span className="font-bold text-gray-700">{Math.min((page + 1) * pageSize, totalItems)}</span> de <span className="font-bold text-gray-700">{totalItems}</span>
        </p>
      </div>
    </nav>
  )
}
