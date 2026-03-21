import { useState } from "react"
import api from "../lib/api"

export default function IssueStockModal({ itemId, itemName, onClose, onSuccess }) {

  const [quantity,  setQuantity]  = useState("")
  const [reference, setReference] = useState("")
  const [notes,     setNotes]     = useState("")
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const submit = async () => {
    const qty = Number(quantity)
    if (!qty || qty <= 0) { setError("Enter a valid quantity greater than zero"); return }
    if (!itemId)           { setError("No item selected"); return }
    setError(null); setLoading(true)
    try {
      await api.post("/transactions/issue", { item_id: itemId, quantity: qty, reference, notes })
      onSuccess(); onClose()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to issue stock")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-800">Issue stock</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {itemName && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 text-sm text-amber-800">
            Issuing from: <span className="font-medium">{itemName}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input type="number" min="1" placeholder="e.g. 5" value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reference</label>
            <input type="text" placeholder="e.g. REQ-2026-001" value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea placeholder="Optional notes..." value={notes}
              onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={submit} disabled={loading}
            className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600
                       disabled:opacity-60 font-medium">
            {loading ? "Issuing..." : "Issue stock"}
          </button>
        </div>

      </div>
    </div>
  )
}