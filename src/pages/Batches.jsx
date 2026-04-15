import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { fetchBatches } from "../services/batchesApi"
import ReceiveStockModal from "../components/ReceiveStockModal"
import EditBatchModal from "../components/EditBatchModal"

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function ExpiryBadge({ dateStr }) {
  if (!dateStr) return <span className="text-gray-300 text-xs">—</span>

  const days = daysUntil(dateStr)
  const label = new Date(dateStr).toLocaleDateString()

  if (days < 0) {
    return (
      <div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
          Expired
        </span>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    )
  }

  if (days <= 30) {
    return (
      <div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
          {days}d left
        </span>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    )
  }

  return <p className="text-xs text-gray-600">{label}</p>
}

function QtyCell({ value, unit, tone = "default" }) {
  const color =
    tone === "danger" ? "text-red-600" :
    tone === "warning" ? "text-amber-600" :
    "text-gray-800"

  return (
    <div>
      <span className={`font-semibold ${color}`}>
        {Number(value || 0).toLocaleString()}
      </span>
      <span className="text-xs text-gray-400 ml-1">{unit}</span>
    </div>
  )
}

export default function StockBatches() {
  const [searchParams] = useSearchParams()

  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState("")
  const [expiring, setExpiring] = useState(searchParams.get("filter") === "expiring")

  const [receiveModal, setReceiveModal] = useState(null)
  const [editBatch, setEditBatch] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchBatches()
      setBatches(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load batches")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    window.addEventListener("labChanged", load)
    return () => window.removeEventListener("labChanged", load)
  }, [load])

  const filtered = batches.filter((b) => {
    const q = search.toLowerCase()

    const matchSearch =
      !search ||
      b.items?.name?.toLowerCase().includes(q) ||
      b.items?.sku?.toLowerCase().includes(q) ||
      b.batch_number?.toLowerCase().includes(q) ||
      b.storage_location?.toLowerCase().includes(q)

    const matchExpiring =
      !expiring || (daysUntil(b.expiry_date) !== null && daysUntil(b.expiry_date) <= 30)

    return matchSearch && matchExpiring
  })

  const totalBatchCount = filtered.length
  const uniqueItemCount = new Set(filtered.map((b) => b.item_id).filter(Boolean)).size
  const activeBatchCount = filtered.filter((b) => Number(b.current_quantity || 0) > 0).length
  const totalReceived = filtered.reduce((sum, b) => sum + Number(b.quantity_received || 0), 0)
  const totalAvailable = filtered.reduce((sum, b) => sum + Number(b.current_quantity || 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Stock Batches</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Batch-level stock records by item, showing received and available balances
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Batch records</p>
          <p className="text-2xl font-bold text-gray-800">{totalBatchCount}</p>
          <p className="text-xs text-gray-400 mt-1">Each row is one item batch record</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Unique items</p>
          <p className="text-2xl font-bold text-indigo-700">{uniqueItemCount}</p>
          <p className="text-xs text-gray-400 mt-1">Distinct items represented in the list</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Active batches</p>
          <p className="text-2xl font-bold text-emerald-700">{activeBatchCount}</p>
          <p className="text-xs text-gray-400 mt-1">Batches with available stock above zero</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Total received</p>
          <p className="text-2xl font-bold text-blue-700">{Number(totalReceived).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Sum of recorded received quantities</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Total available</p>
          <p className="text-2xl font-bold text-green-700">{Number(totalAvailable).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Sum of remaining quantities in store</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="text"
          placeholder="Search by item, SKU, batch number, or location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:w-80
                     focus:outline-none focus:ring-2 focus:ring-blue-200"
        />

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={expiring}
            onChange={(e) => setExpiring(e.target.checked)}
            className="rounded"
          />
          Expiring within 30 days
        </label>

        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
          Loading batches...
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
          No batches found.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Item</th>
                  <th className="text-left px-4 py-3">Batch #</th>
                  <th className="text-left px-4 py-3">Received</th>
                  <th className="text-left px-4 py-3">Available</th>
                  <th className="text-left px-4 py-3">Expiry</th>
                  <th className="text-left px-4 py-3">Location</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {filtered.map((b) => {
                  const baseUnit =
                    b.items?.dispensing_unit || b.items?.unit_of_measure || "units"

                  const available = Number(b.current_quantity || 0)
                  const tone =
                    available === 0 ? "danger" :
                    available < 5 ? "warning" :
                    "default"

                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{b.items?.name ?? "—"}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{b.items?.sku ?? ""}</p>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {b.batch_number || <span className="text-gray-300">—</span>}
                      </td>

                      <td className="px-4 py-3">
                        <QtyCell value={b.quantity_received} unit={baseUnit} />
                        <p className="text-[11px] text-gray-400 mt-0.5">Amount originally received</p>
                      </td>

                      <td className="px-4 py-3">
                        <QtyCell value={b.current_quantity} unit={baseUnit} tone={tone} />
                        <p className="text-[11px] text-gray-400 mt-0.5">Amount currently in store</p>
                      </td>

                      <td className="px-4 py-3">
                        <ExpiryBadge dateStr={b.expiry_date} />
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500">
                        {b.storage_location || <span className="text-gray-300">—</span>}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditBatch(b)}
                            className="text-xs px-2.5 py-1 border border-blue-100 rounded
                                       text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              setReceiveModal({
                                itemId: b.items?.id ?? null,
                                itemName: b.items?.name ?? null,
                              })
                            }
                            className="text-xs px-2.5 py-1 border border-green-100 rounded
                                       text-green-700 hover:bg-green-50 transition-colors"
                          >
                            Receive more
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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

      {editBatch && (
        <EditBatchModal
          batch={editBatch}
          item={editBatch.items}
          onClose={() => setEditBatch(null)}
          onSuccess={load}
        />
      )}
    </div>
  )
}