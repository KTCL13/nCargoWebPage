// src/components/ui/Pagination.tsx
'use client'

import React from 'react'
import ReactPaginate from 'react-paginate'

// ReactPaginate typically needs a fix for some SSR/Typing issues in certain Next.js versions
const ReactPaginateFix = ReactPaginate as any

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
  pageSizeOptions = [10, 20, 50],
}: PaginationProps) {
  const pageCount = Math.ceil(totalItems / pageSize)

  if (totalItems === 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full mt-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      {/* Information and Page Size Selector */}
      <div className="flex items-center gap-4 order-2 sm:order-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-subtitles text-gray-500 whitespace-nowrap">Mostrar</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value))
              onPageChange(0) // Reset to first page when changing size
            }}
            className="text-xs font-subtitles px-2 py-1 rounded-md border border-gray-200 bg-white focus:border-[var(--color-nc-red)] outline-none cursor-pointer hover:border-gray-300 transition"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="text-xs font-subtitles text-gray-500 whitespace-nowrap">por página</span>
        </div>
        
        <div className="hidden md:block h-4 w-px bg-gray-200" />
        
        <p className="text-xs font-subtitles text-gray-500 whitespace-nowrap">
          Mostrando <span className="font-bold text-gray-700">{page * pageSize + 1}</span> - <span className="font-bold text-gray-700">{Math.min((page + 1) * pageSize, totalItems)}</span> de <span className="font-bold text-gray-700">{totalItems}</span>
        </p>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        {/* First Page Button */}
        <button
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold text-[var(--color-nc-dark)] border border-gray-100 hover:border-[var(--color-nc-red)] hover:text-[var(--color-nc-red)] disabled:opacity-30 disabled:pointer-events-none transition bg-white shadow-sm"
          title="Primera página"
        >
          «
        </button>

        <ReactPaginateFix
          forcePage={page}
          pageCount={pageCount}
          pageRangeDisplayed={2}
          marginPagesDisplayed={1}
          onPageChange={({ selected }: { selected: number }) => onPageChange(selected)}
          previousLabel="‹"
          nextLabel="›"
          breakLabel="..."
          containerClassName="flex items-center gap-1 select-none"
          pageClassName="w-8 h-8"
          pageLinkClassName="w-full h-full flex items-center justify-center rounded-md text-sm font-subtitles text-[var(--color-nc-dark)] border border-gray-100 hover:border-[var(--color-nc-red)] hover:text-[var(--color-nc-red)] transition bg-white shadow-sm"
          activeClassName="!border-0"
          activeLinkClassName="!bg-[var(--color-nc-red)] !text-white rounded-md shadow-md"
          previousClassName="w-8 h-8"
          previousLinkClassName="w-full h-full flex items-center justify-center rounded-md text-sm text-[var(--color-nc-dark)] border border-gray-100 hover:bg-gray-50 transition bg-white shadow-sm"
          nextClassName="w-8 h-8"
          nextLinkClassName="w-full h-full flex items-center justify-center rounded-md text-sm text-[var(--color-nc-dark)] border border-gray-100 hover:bg-gray-50 transition bg-white shadow-sm"
          breakClassName="w-8 h-8"
          breakLinkClassName="w-full h-full flex items-center justify-center text-sm text-gray-400"
          disabledClassName="opacity-30 pointer-events-none"
        />

        {/* Last Page Button */}
        <button
          onClick={() => onPageChange(pageCount - 1)}
          disabled={page === pageCount - 1 || pageCount <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold text-[var(--color-nc-dark)] border border-gray-100 hover:border-[var(--color-nc-red)] hover:text-[var(--color-nc-red)] disabled:opacity-30 disabled:pointer-events-none transition bg-white shadow-sm"
          title="Última página"
        >
          »
        </button>
      </div>
    </div>
  )
}
