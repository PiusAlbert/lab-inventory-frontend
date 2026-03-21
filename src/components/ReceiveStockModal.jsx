import { useState } from "react"
import api from "../lib/api"

export default function ReceiveStockModal({ itemId, itemName, onClose, onSuccess }) {

  const [batch,    setBatch]    = useState("")
  const [quantity, setQuantity] = useState("")
  const [expiry,   setExpiry]   = useState("")
  const [location, setLocation] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const submit = async () => {
    const qty = Number(quantity)
    if (!qty || qty <= 0) { setError("Enter a valid quantity greater than zero"); return }
    if (!itemId)           { setError("No item selected"); return }
    setError(null); setLoading(true)
    try {
      await api.post("/batches", {
        item_id: itemId, batch_number: batch,
        quantity_received: qty, expiry_date: expiry || null, storage_location: location
      })
      onSuccess(); onClose()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to receive stock")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-800">Receive stock</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {itemName && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4 text-sm text-green-800">
            Receiving into: <span className="font-medium">{itemName}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Batch number</label>
            <input type="text" placeholder="e.g. BATCH-2026-001" value={batch}
              onChange={e => setBatch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Quantity received <span className="text-red-500">*</span>
            </label>
            <input type="number" min="1" placeholder="e.g. 100" value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Expiry date</label>
            <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Storage location</label>
            <input type="text" placeholder="e.g. Shelf A2, Cold room" value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={submit} disabled={loading}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700
                       disabled:opacity-60 font-medium">
            {loading ? "Saving..." : "Receive stock"}
          </button>
        </div>

      </div>
    </div>
  )
}