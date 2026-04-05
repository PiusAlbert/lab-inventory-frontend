import { useState, useEffect } from "react"
import api from "../lib/api"

/**
 * Issue Stock Modal — dual-unit aware
 *
 * Issue quantity is always entered in dispensing_unit (ml, g, mg).
 * Shows available stock in dispensing units.
 * Validates against available stock before submitting.
 */
export default function IssueStockModal({ itemId, itemName, onClose, onSuccess }) {

  const [item,       setItem]      = useState(null)
  const [batches,    setBatches]   = useState([])
  const [quantity,   setQuantity]  = useState("")
  const [reference,  setReference] = useState("")
  const [notes,      setNotes]     = useState("")
  const [loading,    setLoading]   = useState(false)
  const [error,      setError]     = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/items/${itemId}`),
      api.get(`/batches/item/${itemId}`),
    ])
      .then(([itemRes, batchRes]) => {
        setItem(itemRes.data)
        setBatches(Array.isArray(batchRes.data) ? batchRes.data : [])
      })
      .catch(() => {})
  }, [itemId])

  const dispUnit    = item?.dispensing_unit || item?.unit_of_measure || ""
  const totalStock  = batches.reduce((s, b) => s + Number(b.current_quantity), 0)
  const qtyNum      = Number(quantity)
  const overStock   = qtyNum > totalStock

  const submit = async () => {
    if (!quantity || qtyNum <= 0) {
      setError("Please enter a valid quantity")
      return
    }
    if (overStock) {
      setError(`Insufficient stock. Available: ${totalStock} ${dispUnit}`)
      return
    }
    setLoading(true)
    setError(null)
    try {
      await api.post("/transactions/issue", {
        item_id:   itemId,
        quantity:  qtyNum,     // always in dispensing/base units
        reference: reference || undefined,
        notes:     notes     || undefined,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to issue stock")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay}>
      <div style={modal}>

        {/* Header */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>
            Issue Stock
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
            {itemName}
          </p>
        </div>

        {/* Available stock pill */}
        {item && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: totalStock === 0 ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${totalStock === 0 ? "#fecaca" : "#bbf7d0"}`,
            borderRadius: "8px", padding: "10px 14px",
            marginBottom: "1rem", fontSize: "0.82rem",
          }}>
            <span style={{ color: "#64748b" }}>Available stock</span>
            <strong style={{ color: totalStock === 0 ? "#dc2626" : "#16a34a", fontSize: "1rem" }}>
              {totalStock} {dispUnit}
            </strong>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            color: "#dc2626", borderRadius: "8px",
            padding: "8px 12px", marginBottom: "1rem", fontSize: "0.82rem",
          }}>{error}</div>
        )}

        {/* Quantity */}
        <div style={fieldWrap}>
          <label style={labelStyle}>
            Quantity to issue
            {dispUnit && (
              <span style={{ color: "#64748b" }}> (in {dispUnit})</span>
            )}
          </label>
          <input
            type="number"
            min="0"
            step="any"
            placeholder={dispUnit ? `e.g. 25 ${dispUnit}` : "Enter quantity"}
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            style={{
              ...inputStyle,
              borderColor: overStock ? "#fca5a5" : "#e2e8f0",
            }}
            disabled={totalStock === 0}
          />
          {overStock && (
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#dc2626" }}>
              Exceeds available stock ({totalStock} {dispUnit})
            </p>
          )}
          {quantity && !overStock && qtyNum > 0 && (
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748b" }}>
              Remaining after issue: <strong>{(totalStock - qtyNum).toFixed(4).replace(/\.?0+$/, "")} {dispUnit}</strong>
            </p>
          )}
        </div>

        {/* Reference */}
        <div style={fieldWrap}>
          <label style={labelStyle}>
            Reference <span style={{ color: "#94a3b8" }}>(optional)</span>
          </label>
          <input
            placeholder="e.g. Experiment #12, Student ID"
            value={reference}
            onChange={e => setReference(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>
            Notes <span style={{ color: "#94a3b8" }}>(optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Any additional notes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button onClick={onClose} style={cancelBtn} disabled={loading}>
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading || totalStock === 0 || overStock || !quantity}
            style={submitBtn(loading || totalStock === 0 || overStock || !quantity)}
          >
            {loading
              ? "Issuing…"
              : totalStock === 0
              ? "No stock available"
              : `↑ Issue${qtyNum > 0 ? ` ${qtyNum} ${dispUnit}` : ""}`
            }
          </button>
        </div>

      </div>
    </div>
  )
}

const overlay = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 50,
}
const modal = {
  background: "#fff", borderRadius: "12px",
  padding: "1.5rem", width: "420px", maxWidth: "calc(100vw - 2rem)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
}
const fieldWrap  = { marginBottom: "1rem" }
const labelStyle = {
  display: "block", fontSize: "0.75rem", fontWeight: 600,
  color: "#374151", marginBottom: "5px",
}
const inputStyle = {
  width: "100%", border: "1.5px solid #e2e8f0", borderRadius: "8px",
  padding: "9px 12px", fontSize: "0.88rem", color: "#111827",
  outline: "none", boxSizing: "border-box",
}
const cancelBtn = {
  padding: "9px 18px", borderRadius: "8px",
  border: "1px solid #e2e8f0", background: "#fff",
  fontSize: "0.85rem", fontWeight: 500, cursor: "pointer", color: "#374151",
}
const submitBtn = (disabled) => ({
  padding: "9px 18px", borderRadius: "8px", border: "none",
  background: disabled ? "#fbbf24" : "#f59e0b",
  color: "#fff", fontSize: "0.85rem", fontWeight: 600,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.7 : 1,
})