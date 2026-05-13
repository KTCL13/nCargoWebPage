interface ShipmentSearchProps {
  search: string
  setSearch: (s: string) => void
}

export function ShipmentSearch({ search, setSearch }: ShipmentSearchProps) {
  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      <input
        type="text"
        placeholder="Buscar por tracking, cliente o proyecto..."
        className="w-full md:w-96 px-4 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 ring-blue-500/20"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
    </div>
  )
}
