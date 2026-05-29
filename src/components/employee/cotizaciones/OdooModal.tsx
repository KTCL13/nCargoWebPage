import { ModalShell } from '@/components/ui/ModalShell'

interface OdooModalProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  isSearching: boolean
  customers: any[]
  selectedCustomer: any | null
  setSelectedCustomer: (c: any | null) => void
  isSending: boolean
  error: string
  success: string
  onSend: () => void
}

export function OdooModal({
  isOpen, onClose, searchQuery, setSearchQuery, isSearching,
  customers, selectedCustomer, setSelectedCustomer,
  isSending, error, success, onSend,
}: OdooModalProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Vincular Cliente Odoo"
      subtitle="Busca y selecciona el cliente para la cotización"
      maxWidth="md"
      footer={
        <button
          onClick={onSend}
          disabled={!selectedCustomer || isSending}
          className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50 flex items-center gap-2"
        >
          {isSending
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</>
            : 'Confirmar Envío'}
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, email o CC..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input pl-10"
            autoFocus
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" aria-hidden="true">🔍</span>
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[var(--color-nc-blue)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2">
          {customers.length > 0 ? (
            customers.map(customer => (
              <button
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className={`flex flex-col gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                  selectedCustomer?.id === customer.id
                    ? 'border-[var(--color-nc-blue)] bg-[var(--color-nc-blue)]/5'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-subtitles font-bold text-sm text-gray-900">{customer.name}</span>
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">ID: {customer.id}</span>
                </div>
                <div className="flex flex-col text-xs text-gray-500 font-subtitles">
                  <span>📧 {customer.email}</span>
                  <span>🆔 CC/NIT: {customer.vat}</span>
                </div>
              </button>
            ))
          ) : searchQuery.length >= 3 && !isSearching ? (
            <p className="py-10 text-center text-gray-600 font-subtitles text-sm">No se encontraron clientes que coincidan.</p>
          ) : !searchQuery ? (
            <p className="py-10 text-center text-gray-500 font-subtitles text-sm">Empieza a escribir para buscar...</p>
          ) : null}
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-subtitles">⚠️ {error}</div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 text-xs p-3 rounded-xl border border-green-100 font-subtitles">✅ {success}</div>
        )}
      </div>
    </ModalShell>
  )
}
