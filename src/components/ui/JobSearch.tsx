'use client'

import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { authFetch } from '@/lib/api-client/auth-fetch'

interface Job {
  id: number
  title: string
  description?: string | null
}

interface JobSearchProps {
  value?: Job | null
  onChange: (job: Job | null) => void
  disabled?: boolean
  label?: string
  error?: string
  placeholder?: string
  className?: string
}

export function JobSearch({
  value = null,
  onChange,
  disabled = false,
  label,
  error,
  placeholder = 'Buscar cargo...',
  className = '',
}: JobSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 250)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetch = async () => {
      if (debouncedQuery.length < 1) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const res = await authFetch(`/api/jobs?search=${encodeURIComponent(debouncedQuery)}&limit=10`)
        const json = await res.json()
        setResults(Array.isArray(json.data) ? json.data : [])
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [debouncedQuery])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (job: Job) => {
    onChange(job)
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
          {label}
        </label>
      )}

      {value ? (
        <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--radius-lg)] border ${error ? 'border-red-500' : 'border-gray-200'} bg-blue-50 border-blue-200`}>
          <span className="text-sm font-bold text-blue-900 truncate">{value.title}</span>
          {!disabled && (
            <button type="button" onClick={handleClear}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-blue-100 text-blue-600 shrink-0 transition">
              ×
            </button>
          )}
        </div>
      ) : (
        <div className={`flex items-center border rounded-[var(--radius-lg)] bg-white transition-all focus-within:ring-2 focus-within:ring-[var(--color-primary)]/25 focus-within:border-[var(--color-primary)] ${error ? 'border-red-500' : 'border-gray-200'} ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
          <input
            type="text"
            value={query}
            disabled={disabled}
            onChange={e => { setQuery(e.target.value); setIsOpen(true) }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none shadow-none outline-none text-sm px-3 py-2 placeholder:text-gray-400"
          />
          <div className="flex items-center pr-3">
            {loading
              ? <div className="w-4 h-4 border-2 border-gray-300 border-t-[var(--color-primary)] rounded-full animate-spin" />
              : <span className="text-gray-400 text-xs">🔍</span>}
          </div>

          {isOpen && results.length > 0 && (
            <div className="absolute z-[110] left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="max-h-52 overflow-y-auto p-1.5">
                {results.map(job => (
                  <button key={job.id} type="button" onClick={() => handleSelect(job)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition">
                    <p className="text-sm font-bold text-gray-900">{job.title}</p>
                    {job.description && (
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{job.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase">{error}</p>}
    </div>
  )
}
