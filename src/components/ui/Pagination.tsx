// src/components/ui/Pagination.tsx
'use client'

import ReactPaginate from 'react-paginate'

// 1. Creamos una referencia tipada como 'any'
const ReactPaginateFix = ReactPaginate as any

interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null

  return (
    /* 2. Usamos el componente fix en lugar del original */
    <ReactPaginateFix
      forcePage={page}
      pageCount={pageCount}
      pageRangeDisplayed={3}
      marginPagesDisplayed={1}
      onPageChange={({ selected }: { selected: number }) => onPageChange(selected)}
      // ... resto de tus props se mantienen igual
      previousLabel="‹"
      nextLabel="›"
      breakLabel="..."
      containerClassName="flex items-center gap-1 select-none"
      pageClassName="w-8 h-8"
      pageLinkClassName="w-full h-full flex items-center justify-center rounded-md text-sm font-subtitles text-[var(--color-nc-dark)] border border-transparent hover:border-[var(--color-nc-red)] hover:text-[var(--color-nc-red)] transition"
      activeClassName="!border-0"
      activeLinkClassName="!bg-[var(--color-nc-red)] !text-white rounded-md"
      previousClassName="w-8 h-8"
      previousLinkClassName="w-full h-full flex items-center justify-center rounded-md text-sm text-[var(--color-nc-dark)] hover:bg-gray-100 transition"
      nextClassName="w-8 h-8"
      nextLinkClassName="w-full h-full flex items-center justify-center rounded-md text-sm text-[var(--color-nc-dark)] hover:bg-gray-100 transition"
      breakClassName="w-8 h-8"
      breakLinkClassName="w-full h-full flex items-center justify-center text-sm text-gray-400"
      disabledClassName="opacity-40 pointer-events-none"
    />
  )
}
