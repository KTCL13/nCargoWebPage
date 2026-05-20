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
  isSending, error, success, onSend
}: OdooModalProps) {
  if (!isOpen) return null

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#714B67]/5">
          <div>
            <h3 className="font-titles text-xl font-bold text-[#714B67]">Vincular Cliente Odoo</h3>
            <p className="font-subtitles text-xs text-gray-500 mt-1">Busca y selecciona el cliente para la cotización</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre, email o CC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 pl-12 text-sm font-subtitles outline-none focus:border-[#714B67] transition-all"
              autoFocus
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl">🔍</span>
            {isSearching && (
              <div className="absolute right-5 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-[#714B67] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-2">
            {customers.length > 0 ? (
              customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`flex flex-col gap-1 p-4 rounded-2xl border-2 text-left transition-all ${selectedCustomer?.id === customer.id
                      ? 'border-[#714B67] bg-[#714B67]/5'
                      : 'border-gray-50 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-titles font-bold text-gray-900">{customer.name}</span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">ID: {customer.id}</span>
                  </div>
                  <div className="flex flex-col text-xs text-gray-500 font-subtitles">
                    <span>📧 {customer.email}</span>
                    <span>🆔 CC/NIT: {customer.vat}</span>
                  </div>
                </button>
              ))
            ) : searchQuery.length >= 3 && !isSearching ? (
              <div className="py-10 text-center">
                <p className="text-gray-600 font-subtitles text-sm">No se encontraron clientes que coincidan.</p>
              </div>
            ) : !searchQuery ? (
              <div className="py-10 text-center">
                <p className="text-gray-500 font-subtitles text-sm">Empieza a escribir para buscar...</p>
              </div>
            ) : null}
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-subtitles">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 text-xs p-3 rounded-xl border border-green-100 font-subtitles animate-bounce">
              ✅ {success}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-bold font-subtitles text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSend}
            disabled={!selectedCustomer || isSending}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold font-subtitles text-white shadow-lg transition-all ${!selectedCustomer || isSending
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-[#714B67] hover:brightness-110 active:scale-95'
              }`}
          >
            {isSending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enviando...
              </div>
            ) : (
              'Confirmar Envío'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
