import { useMemo, useState } from "react"
import { updateBatch } from "../services/batchesApi"

export default function EditBatchModal({ batch, item = null, onClose, onSuccess }) {
  const [quantityReceived, setQuantityReceived] = useState(
    batch?.quantity_received != null ? String(batch.quantity_received) : ""
  )
  const [currentQuantity, setCurrentQuantity] = useState(
    batch?.current_quantity != null ? String(batch.current_quantity) : ""
  )
  const [expiry, setExpiry] = useState(
    batch?.expiry_date ? String(batch.expiry_date).slice(0, 10) : ""
  )
  const [location, setLocation] = useState(batch?.storage_location || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const unitLabel = useMemo(() => {
    if (item?.dispensing_unit) return item.dispensing_unit
    if (item?.unit_of_measure) return item.unit_of_measure
    if (batch?.items?.dispensing_unit) return batch.items.dispensing_unit
    if (batch?.items?.unit_of_measure) return batch.items.unit_of_measure
    return "units"
  }, [item, batch])

  const itemName = item?.name || batch?.items?.name || "Item"
  const batchNumber = batch?.batch_number || "Unnumbered batch"

  const submit = async () => {
    const receivedNum = Number(quantityReceived)
    const currentNum = Number(currentQuantity)

    if (quantityReceived === "" || Number.isNaN(receivedNum) || receivedNum < 0) {
      setError("Please enter a valid received quantity")
      return
    }

    if (currentQuantity === "" || Number.isNaN(currentNum) || currentNum < 0) {
      setError("Please enter a valid available quantity")
      return
    }

    if (currentNum > receivedNum) {
      setError("Available quantity cannot be greater than received quantity")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await updateBatch(batch.id, {
        quantity_received: receivedNum,
        current_quantity: currentNum,
        expiry_date: expiry || null,
        storage_location: location.trim() || null,
      })

      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update batch")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ marginBottom: "1.25rem" }}>
          <h3 style={titleStyle}>Edit Batch Record</h3>
          <p style={subtleStyle}>
            {itemName} · {batchNumber}
          </p>
        </div>

        <div style={warningBox}>
          <strong>Correction mode:</strong> Use this only when the recorded batch values
          are wrong. This updates the stored batch record directly.
        </div>

        {error && (
          <div style={errorBox}>
            {error}
          </div>
        )}

        <div style={grid}>
          <div style={fieldWrap}>
            <label style={labelStyle}>
              Amount received <span style={unitStyle}>({unitLabel})</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={quantityReceived}
              onChange={(e) => setQuantityReceived(e.target.value)}
              placeholder={`Enter received amount in ${unitLabel}`}
              style={inputStyle}
            />
            <p style={hintStyle}>
              Original quantity entered when this batch was received.
            </p>
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>
              Amount available in store <span style={unitStyle}>({unitLabel})</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={currentQuantity}
              onChange={(e) => setCurrentQuantity(e.target.value)}
              placeholder={`Enter available amount in ${unitLabel}`}
              style={inputStyle}
            />
            <p style={hintStyle}>
              Remaining quantity currently available for issue.
            </p>
          </div>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>
            Expiry date <span style={optionalStyle}>(optional)</span>
          </label>
          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>
            Storage location <span style={optionalStyle}>(optional)</span>
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Shelf A3, Cold Room 1, Cabinet B..."
            style={inputStyle}
          />
        </div>

        <div style={infoBox}>
          <div style={infoRow}>
            <span style={infoLabel}>Previous received:</span>
            <span style={infoValue}>
              {Number(batch?.quantity_received || 0).toLocaleString()} {unitLabel}
            </span>
          </div>
          <div style={infoRow}>
            <span style={infoLabel}>Previous available:</span>
            <span style={infoValue}>
              {Number(batch?.current_quantity || 0).toLocaleString()} {unitLabel}
            </span>
          </div>
        </div>

        <div style={actionsRow}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              ...buttonBase,
              background: "#fff",
              border: "1px solid #cbd5e1",
              color: "#334155",
            }}
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={loading}
            style={{
              ...buttonBase,
              background: loading ? "#93c5fd" : "#2563eb",
              border: "1px solid #2563eb",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "1rem",
}

const modal = {
  width: "100%",
  maxWidth: "560px",
  background: "#fff",
  borderRadius: "14px",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.2)",
  padding: "1.25rem",
}

const titleStyle = {
  margin: 0,
  fontSize: "1rem",
  fontWeight: 700,
  color: "#0f172a",
}

const subtleStyle = {
  margin: "4px 0 0",
  fontSize: "0.8rem",
  color: "#94a3b8",
}

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
}

const fieldWrap = {
  marginBottom: "1rem",
}

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "#334155",
}

const unitStyle = {
  color: "#64748b",
  fontWeight: 500,
}

const optionalStyle = {
  color: "#94a3b8",
  fontWeight: 500,
}

const hintStyle = {
  margin: "6px 0 0",
  fontSize: "0.75rem",
  color: "#94a3b8",
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "0.9rem",
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
}

const warningBox = {
  background: "#fff7ed",
  border: "1px solid #fdba74",
  borderRadius: "8px",
  padding: "10px 12px",
  marginBottom: "1rem",
  fontSize: "0.82rem",
  color: "#9a3412",
}

const errorBox = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#dc2626",
  borderRadius: "8px",
  padding: "8px 12px",
  marginBottom: "1rem",
  fontSize: "0.82rem",
}

const infoBox = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "12px",
  marginTop: "0.5rem",
}

const infoRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  fontSize: "0.82rem",
  marginBottom: "6px",
}

const infoLabel = {
  color: "#64748b",
}

const infoValue = {
  color: "#0f172a",
  fontWeight: 600,
}

const actionsRow = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "1.25rem",
}

const buttonBase = {
  padding: "10px 14px",
  borderRadius: "8px",
  fontSize: "0.86rem",
  fontWeight: 600,
}