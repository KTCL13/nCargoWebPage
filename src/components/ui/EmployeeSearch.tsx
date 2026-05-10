'use client'

import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

interface Employee {
  id: number
  firstName: string
  lastName: string
  identificationNumber: string
  identificationType: {
    name: string
  }
}

function empFullName(emp: Employee) {
  return `${emp.firstName} ${emp.lastName}`
}

interface EmployeeSearchProps {
  onSelect?: (employee: Employee | null) => void
  onMultiSelect?: (employees: Employee[]) => void
  multi?: boolean
  placeholder?: string
  className?: string
  label?: string
  error?: string
  defaultValue?: Employee | null
  defaultValues?: Employee[]
}

const DEFAULT_EMPTY_ARRAY: any[] = []

export function EmployeeSearch({
  onSelect,
  onMultiSelect,
  multi = false,
  placeholder = "Buscar empleado por nombre o ID...",
  className = "",
  label,
  error,
  defaultValue = null,
  defaultValues = DEFAULT_EMPTY_ARRAY
}: EmployeeSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<Employee | null>(defaultValue)
  const [selectedMulti, setSelectedMulti] = useState<Employee[]>(defaultValues)
  const debouncedQuery = useDebounce(query, 300)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (defaultValue != null && defaultValue.id !== selected?.id) {
      setSelected(defaultValue)
    }
  }, [defaultValue, selected?.id])

  useEffect(() => {
    if (defaultValues !== undefined) {
      const idsA = defaultValues.map(e => e.id).sort().join(',')
      const idsB = selectedMulti.map(e => e.id).sort().join(',')
      if (idsA !== idsB) {
        setSelectedMulti(defaultValues)
      }
    }
  }, [defaultValues, selectedMulti])

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/employees?search=${encodeURIComponent(debouncedQuery)}&limit=10`)
        const json = await res.json()
        const data = json.data || json || []
        setResults(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error searching employees:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (emp: Employee) => {
    if (multi) {
      if (selectedMulti.some(e => e.id === emp.id)) return
      const newMulti = [...selectedMulti, emp]
      setSelectedMulti(newMulti)
      onMultiSelect?.(newMulti)
      setQuery("")
    } else {
      setSelected(emp)
      onSelect?.(emp)
      setQuery("")
    }
    setResults([])
    setIsOpen(false)
  }

  const handleRemove = (id: number) => {
    const newMulti = selectedMulti.filter(e => e.id !== id)
    setSelectedMulti(newMulti)
    onMultiSelect?.(newMulti)
  }

  const handleClear = () => {
    setSelected(null)
    onSelect?.(null)
    setQuery("")
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          {label}
        </label>
      )}

      {!multi && selected ? (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-[var(--radius-lg)] animate-in fade-in zoom-in duration-200">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[var(--color-nc-blue)] text-white flex items-center justify-center text-[10px] font-bold">
                {(selected.firstName[0] + selected.lastName[0]).toUpperCase()}
             </div>
             <div>
                <p className="text-sm font-bold text-blue-900 leading-none">{empFullName(selected)}</p>
                <p className="text-[10px] text-blue-700 font-mono mt-1">ID: {selected.identificationNumber}</p>
             </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-blue-100 text-blue-600 transition"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className={`flex flex-wrap gap-2 p-1 border rounded-[var(--radius-lg)] bg-white transition-all focus-within:ring-2 focus-within:ring-[var(--color-primary)]/25 focus-within:border-[var(--color-primary)] ${error ? 'border-red-500' : 'border-gray-200'}`}>
            {multi && selectedMulti.map(emp => (
              <div key={emp.id} className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-700 animate-in fade-in zoom-in duration-200">
                <span>{empFullName(emp)}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(emp.id)}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500 transition"
                >
                  ×
                </button>
              </div>
            ))}
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={multi && selectedMulti.length > 0 ? "" : placeholder}
              className="flex-1 min-w-[120px] bg-transparent border-none shadow-none outline-none text-sm px-3 py-2 placeholder:text-gray-400"
            />
            <div className="flex items-center pr-3">
              {loading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-[var(--color-primary)] rounded-full animate-spin" />
              ) : (
                <span className="text-gray-300 text-xs">🔍</span>
              )}
            </div>
          </div>

          {isOpen && (query.length >= 2 || results.length > 0) && (
            <div className="absolute z-[110] left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              {results.length > 0 ? (
                <div className="max-h-60 overflow-y-auto p-2">
                  {results.map((emp) => {
                    const isSelected = multi && selectedMulti.some(e => e.id === emp.id)
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        disabled={isSelected}
                        onClick={() => handleSelect(emp)}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition ${isSelected ? 'opacity-40 cursor-default bg-gray-50' : 'hover:bg-gray-50'}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-gray-200 text-gray-400' : 'bg-[var(--color-nc-dark)] text-white'}`}>
                          {(emp.firstName[0] + emp.lastName[0]).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{empFullName(emp)}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{emp.identificationType?.name}: {emp.identificationNumber}</p>
                        </div>
                        {isSelected && <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase">Seleccionado</span>}
                      </button>
                    )
                  })}
                </div>
              ) : !loading && query.length >= 2 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-400 font-subtitles">No se encontraron empleados</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase">{error}</p>}
    </div>
  )
}
