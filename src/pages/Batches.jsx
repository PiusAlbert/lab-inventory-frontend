import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { fetchBatches } from "../services/batchesApi"
import ReceiveStockModal from "../components/ReceiveStockModal"

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function ExpiryBadge({ dateStr }) {
  if (!dateStr) return <span className="text-gray-300 text-xs">—</span>
  const days = daysUntil(dateStr)
  const label = new Date(dateStr).toLocaleDateString()
  if (days < 0)
    return (
      <div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
          Expired
        </span>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    )
  if (days <= 30)
    return (
      <div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
          {days}d left
        </span>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    )
  return <p className="text-xs text-gray-600">{label}</p>
}

export default function StockBatches() {

  const [searchParams]              = useSearchParams()
  const [batches,  setBatches]      = useState([])
  const [loading,  setLoading]      = useState(true)
  const [error,    setError]        = useState(null)
  const [search,   setSearch]       = useState("")
  const [expiring, setExpiring]     = useState(searchParams.get("filter") === "expiring")
  const [receiveModal, setReceiveModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setBatches(await fetchBatches())
    } catch (err) {
      setError(err.message || "Failed to load batches")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = batches.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      b.items?.name?.toLowerCase().includes(q) ||
      b.items?.sku?.toLowerCase().includes(q) ||
      b.batch_number?.toLowerCase().includes(q)
    const matchExpiring = !expiring || (daysUntil(b.expiry_date) !== null && daysUntil(b.expiry_date) <= 30)
    return matchSearch && matchExpiring
  })

  return (
    <div className="space-y-5">

      {/* TOP BAR */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Stock Batches</h2>
          <p className="text-xs text-gray-400 mt-0.5">{batches.length} batches total</p>
        </div>
        <button
          onClick={() => setReceiveModal({ itemId: null, itemName: null })}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                     bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          ↓ Receive stock
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4
                      flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search item, SKU, or batch number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-72
                     focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={expiring}
            onChange={e => setExpiring(e.target.checked)}
            className="rounded"
          />
          Expiring within 30 days
        </label>
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10
                        text-center text-sm text-gray-400">Loading batches...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10
                        text-center text-sm text-gray-400">No batches found.</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Item</th>
                  <th className="text-left px-4 py-3">Batch #</th>
                  <th className="text-left px-4 py-3">Received</th>
                  <th className="text-left px-4 py-3">Current qty</th>
                  <th className="text-left px-4 py-3">Expiry</th>
                  <th className="text-left px-4 py-3">Location</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">

                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{b.items?.name ?? "—"}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{b.items?.sku ?? ""}</p>
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {b.batch_number || <span className="text-gray-300">—</span>}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-500">
                      {b.quantity_received} {b.items?.unit_of_measure}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`font-medium ${
                        b.current_quantity === 0 ? "text-red-600" :
                        b.current_quantity < 5   ? "text-amber-600" : "text-gray-800"
                      }`}>
                        {b.current_quantity}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">{b.items?.unit_of_measure}</span>
                    </td>

                    <td className="px-4 py-3">
                      <ExpiryBadge dateStr={b.expiry_date} />
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-500">
                      {b.storage_location || <span className="text-gray-300">—</span>}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => setReceiveModal({
                          itemId:   b.items?.id ?? null,
                          itemName: b.items?.name ?? null
                        })}
                        className="text-xs px-2.5 py-1 border border-gray-200 rounded
                                   text-green-700 hover:bg-green-50 transition-colors"
                      >
                        Receive more
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {receiveModal && (
        <ReceiveStockModal
          {...receiveModal}
          onClose={() => setReceiveModal(null)}
          onSuccess={load}
        />
      )}

    </div>
  )
}