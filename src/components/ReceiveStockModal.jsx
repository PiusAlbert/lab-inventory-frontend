import { useState, useEffect } from "react"
import api from "../lib/api"

/**
 * Receive Stock Modal — dual-unit aware
 *
 * If the item has a dispensing_unit + conversion_factor, the modal shows:
 *   - Input in STOCK UNITS (bottles, kg, boxes)
 *   - Live preview: "2 bottles × 500 ml = 1000 ml stored"
 *
 * If no conversion (equipment, consumables), works exactly as before.
 */
export default function ReceiveStockModal({ itemId, itemName, onClose, onSuccess }) {

  const [item,          setItem]         = useState(null)
  const [batchNumber,   setBatchNumber]  = useState("")
  const [quantity,      setQuantity]     = useState("")
  const [expiry,        setExpiry]       = useState("")
  const [location,      setLocation]     = useState("")
  const [loading,       setLoading]      = useState(false)
  const [error,         setError]        = useState(null)

  // Fetch item details to know if conversion is needed
  useEffect(() => {
    api.get(`/items/${itemId}`)
      .then(r => setItem(r.data))
      .catch(() => {})
  }, [itemId])

  const hasDualUnit = item?.dispensing_unit && item?.conversion_factor
  const factor      = hasDualUnit ? Number(item.conversion_factor) : 1
  const baseQty     = quantity ? parseFloat((Number(quantity) * factor).toFixed(4)) : null
  const stockUnit   = item?.unit_of_measure   || ""
  const baseUnit    = item?.dispensing_unit   || item?.unit_of_measure || ""

  const submit = async () => {
    if (!quantity || Number(quantity) <= 0) {
      setError("Please enter a valid quantity")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await api.post("/batches", {
        item_id:           itemId,
        batch_number:      batchNumber  || undefined,
        quantity_received: Number(quantity),   // in stock units — backend converts
        expiry_date:       expiry       || undefined,
        storage_location:  location     || undefined,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to receive stock")
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
            Receive Stock
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
            {itemName}
          </p>
        </div>

        {/* Dual-unit info banner */}
        {hasDualUnit && (
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe",
            borderRadius: "8px", padding: "10px 14px",
            marginBottom: "1rem", fontSize: "0.8rem", color: "#1d4ed8",
          }}>
            <strong>Unit conversion active:</strong> Enter quantity in{" "}
            <strong>{stockUnit}</strong>. Each {stockUnit} = {factor} {baseUnit}.
            Stock will be tracked in <strong>{baseUnit}</strong>.
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

        {/* Batch number */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Batch number <span style={{ color: "#94a3b8" }}>(optional)</span></label>
          <input
            placeholder={`e.g. ${item?.sku || "BATCH"}-001`}
            value={batchNumber}
            onChange={e => setBatchNumber(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Quantity */}
        <div style={fieldWrap}>
          <label style={labelStyle}>
            Quantity received
            {hasDualUnit
              ? <span style={{ color: "#64748b" }}> (in {stockUnit})</span>
              : stockUnit ? <span style={{ color: "#64748b" }}> ({stockUnit})</span> : null
            }
          </label>
          <input
            type="number"
            min="0"
            step="any"
            placeholder={hasDualUnit ? `e.g. 2 (${stockUnit})` : "e.g. 10"}
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            style={inputStyle}
          />

          {/* Live conversion preview */}
          {hasDualUnit && baseQty !== null && quantity !== "" && (
            <div style={{
              marginTop: "6px", padding: "8px 12px",
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: "6px", fontSize: "0.78rem", color: "#15803d",
            }}>
              {quantity} {quantity === "1" ? stockUnit : `${stockUnit}s`}
              {" × "}{factor} {baseUnit}/{stockUnit}
              {" = "}<strong>{baseQty} {baseUnit}</strong> will be stored
            </div>
          )}
        </div>

        {/* Expiry */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Expiry date <span style={{ color: "#94a3b8" }}>(optional)</span></label>
          <input
            type="date"
            value={expiry}
            onChange={e => setExpiry(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Storage location */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Storage location <span style={{ color: "#94a3b8" }}>(optional)</span></label>
          <input
            placeholder="e.g. Cabinet A, Shelf 3"
            value={location}
            onChange={e => setLocation(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button onClick={onClose} style={cancelBtn} disabled={loading}>
            Cancel
          </button>
          <button onClick={submit} style={submitBtn(loading)} disabled={loading}>
            {loading ? "Saving…" : `↓ Receive${baseQty ? ` ${baseQty} ${baseUnit}` : ""}`}
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
const submitBtn = (loading) => ({
  padding: "9px 18px", borderRadius: "8px", border: "none",
  background: loading ? "#86efac" : "#16a34a",
  color: "#fff", fontSize: "0.85rem", fontWeight: 600,
  cursor: loading ? "not-allowed" : "pointer",
})