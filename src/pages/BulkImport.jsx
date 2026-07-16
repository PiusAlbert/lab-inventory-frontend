import { useRef, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { importItems } from "../services/itemsApi"

// ── CSV template ──────────────────────────────────────────────────────
const TEMPLATE_HEADERS = [
  "name", "sku", "category", "item_type", "unit_of_measure",
  "minimum_threshold", "reorder_quantity", "hazard_class",
  "storage_condition", "is_perishable", "unit_price",
  "maintenance_interval_days", "certification_expiry",
]
const TEMPLATE_ROWS = [
  ["Hydrochloric Acid 37%", "HCL-001", "Chemicals", "CHEMICAL", "mL", "100", "500", "CORROSIVE", "Ventilated cabinet", "false", "12.50", "", ""],
  ["Distilled Water", "DW-001", "Reagents", "GENERAL", "L", "10", "50", "", "", "false", "1.50", "", ""],
  ["Analytical Balance", "AB-001", "Equipment", "EQUIPMENT", "pcs", "1", "1", "", "Lab shelf", "false", "850.00", "365", ""],
  ["pH Buffer Solution pH7", "PH7-001", "Reference Materials", "CRM", "mL", "50", "200", "", "", "false", "35.00", "", "2027-06-30"],
]

function downloadTemplate() {
  const escape = (v) => (String(v).includes(",") ? `"${v}"` : v)
  const lines  = [
    TEMPLATE_HEADERS.join(","),
    ...TEMPLATE_ROWS.map(r => r.map(escape).join(",")),
  ]
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement("a"), { href: url, download: "items_import_template.csv" })
  a.click()
  URL.revokeObjectURL(url)
}

// ── CSV parser (handles quoted fields) ────────────────────────────────
function parseCSV(text) {
  const parseRow = (line) => {
    const fields = []
    let field = "", inQuote = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') { field += '"'; i++ }
        else inQuote = !inQuote
      } else if (c === "," && !inQuote) {
        fields.push(field.trim()); field = ""
      } else {
        field += c
      }
    }
    fields.push(field.trim())
    return fields
  }

  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [], error: "File appears empty or has no data rows." }

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, "_").trim())
  const required = ["name", "sku", "category", "item_type", "unit_of_measure"]
  const missing  = required.filter(h => !headers.includes(h))
  if (missing.length) return { headers, rows: [], error: `Missing required columns: ${missing.join(", ")}` }

  const rows = lines.slice(1)
    .map(line => {
      const values = parseRow(line)
      const obj = {}
      headers.forEach((h, i) => { obj[h] = values[i] ?? "" })
      return obj
    })
    .filter(row => Object.values(row).some(v => v !== ""))

  return { headers, rows, error: null }
}

// ── Shared styles ─────────────────────────────────────────────────────
const card = {
  background: "#fff", borderRadius: "12px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  border: "1px solid #f1f5f9", padding: "1.5rem",
  marginBottom: "1.25rem",
}

export default function BulkImport() {
  const { role } = useAuth()
  const fileRef  = useRef(null)

  const [parsed,    setParsed]    = useState(null)   // { headers, rows, error }
  const [fileName,  setFileName]  = useState(null)
  const [dragging,  setDragging]  = useState(false)
  const [importing, setImporting] = useState(false)
  const [result,    setResult]    = useState(null)   // { imported, skipped, errors }
  const [parseErr,  setParseErr]  = useState(null)

  if (!["LAB_MANAGER", "SUPER_ADMIN"].includes(role)) {
    return (
      <div style={{ padding: "2rem", color: "#64748b", fontSize: "0.9rem" }}>
        You do not have permission to import items.
      </div>
    )
  }

  const handleFile = (file) => {
    if (!file) return
    if (!file.name.endsWith(".csv")) {
      setParseErr("Please select a .csv file.")
      return
    }
    setFileName(file.name)
    setResult(null)
    setParseErr(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const p = parseCSV(e.target.result)
      if (p.error) { setParseErr(p.error); setParsed(null) }
      else          { setParsed(p) }
    }
    reader.readAsText(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleImport = async () => {
    if (!parsed?.rows?.length) return
    setImporting(true)
    setResult(null)
    try {
      const res = await importItems(parsed.rows)
      setResult(res)
      setParsed(null)
      setFileName(null)
    } catch (err) {
      setResult({ imported: 0, skipped: 0, errors: [{ row: "—", error: err.response?.data?.error ?? err.message }] })
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setParsed(null); setFileName(null); setResult(null); setParseErr(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const PREVIEW_COLS = ["name", "sku", "category", "item_type", "unit_of_measure", "hazard_class"]

  return (
    <div style={{ maxWidth: "860px", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
          Bulk Item Import
        </h1>
        <p style={{ margin: 0, fontSize: "0.83rem", color: "#64748b" }}>
          Upload a CSV to add multiple inventory items at once.
        </p>
      </div>

      {/* Template + instructions */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
              Step 1 — Download the template
            </h2>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
              Fill it in and upload below. Required columns:{" "}
              <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: "4px", fontSize: "0.75rem" }}>
                name, sku, category, item_type, unit_of_measure
              </code>
            </p>
            <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "#94a3b8" }}>
              Valid item_type values: <strong>GENERAL</strong>, <strong>CHEMICAL</strong> (needs hazard_class),{" "}
              <strong>EQUIPMENT</strong> (needs maintenance_interval_days), <strong>CRM</strong> (needs certification_expiry)
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff", border: "none", borderRadius: "8px",
              padding: "9px 18px", fontSize: "0.82rem", fontWeight: 600,
              cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
            }}
          >
            📥 Download Template
          </button>
        </div>
      </div>

      {/* Upload zone */}
      {!result && (
        <div style={card}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
            Step 2 — Upload your CSV
          </h2>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "#2563eb" : "#cbd5e1"}`,
              borderRadius: "10px",
              padding: "2.5rem 1rem",
              textAlign: "center",
              cursor: "pointer",
              background: dragging ? "#eff6ff" : "#f8fafc",
              transition: "all 0.15s",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: "1.75rem" }}>📂</p>
            <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#374151", fontSize: "0.88rem" }}>
              {fileName ? `Selected: ${fileName}` : "Drag & drop a CSV here, or click to browse"}
            </p>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.76rem" }}>
              .csv files only · max 500 rows
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={e => handleFile(e.target.files[0])}
            />
          </div>

          {parseErr && (
            <div style={{
              marginTop: "12px", padding: "10px 14px", borderRadius: "8px",
              background: "#fef2f2", border: "1px solid #fecaca",
              color: "#dc2626", fontSize: "0.82rem",
            }}>
              {parseErr}
            </div>
          )}

          {/* Preview */}
          {parsed && (
            <div style={{ marginTop: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 600, color: "#374151" }}>
                  Preview — {parsed.rows.length} row{parsed.rows.length !== 1 ? "s" : ""} detected
                </p>
                <button
                  onClick={reset}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.78rem" }}
                >
                  ✕ Clear
                </button>
              </div>

              <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                        #
                      </th>
                      {PREVIEW_COLS.map(col => (
                        <th key={col} style={{ padding: "8px 10px", textAlign: "left", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.slice(0, 20).map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "7px 10px", color: "#94a3b8" }}>{i + 2}</td>
                        {PREVIEW_COLS.map(col => (
                          <td key={col} style={{
                            padding: "7px 10px", color: "#374151",
                            maxWidth: "160px", whiteSpace: "nowrap",
                            overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {row[col] || <span style={{ color: "#cbd5e1" }}>—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsed.rows.length > 20 && (
                <p style={{ margin: "8px 0 0", fontSize: "0.75rem", color: "#94a3b8", textAlign: "center" }}>
                  Showing first 20 of {parsed.rows.length} rows
                </p>
              )}

              <div style={{ marginTop: "1.25rem", display: "flex", gap: "10px" }}>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  style={{
                    background: importing ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "#fff", border: "none", borderRadius: "8px",
                    padding: "10px 24px", fontSize: "0.85rem", fontWeight: 600,
                    cursor: importing ? "not-allowed" : "pointer",
                  }}
                >
                  {importing ? "Importing…" : `Import ${parsed.rows.length} Row${parsed.rows.length !== 1 ? "s" : ""}`}
                </button>
                <button
                  onClick={reset}
                  style={{
                    background: "#f1f5f9", color: "#374151",
                    border: "1px solid #e2e8f0", borderRadius: "8px",
                    padding: "10px 18px", fontSize: "0.85rem", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={card}>
          <h2 style={{ margin: "0 0 1.25rem", fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
            Import Complete
          </h2>

          {/* Stat row */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {[
              { label: "Imported", value: result.imported, bg: "#f0fdf4", color: "#16a34a" },
              { label: "Skipped (duplicate SKU)", value: result.skipped, bg: "#fff7ed", color: "#d97706" },
              { label: "Errors", value: result.errors.filter(e => !e.error.includes("skipped")).length, bg: "#fef2f2", color: "#dc2626" },
            ].map(({ label, value, bg, color }) => (
              <div key={label} style={{
                background: bg, borderRadius: "10px", padding: "12px 18px",
                border: `1px solid ${color}22`, minWidth: "120px",
              }}>
                <p style={{ margin: "0 0 2px", fontSize: "1.4rem", fontWeight: 700, color }}>{value}</p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#64748b" }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Error list */}
          {result.errors.length > 0 && (
            <div>
              <p style={{ margin: "0 0 8px", fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>
                Row-level details
              </p>
              <div style={{ maxHeight: "280px", overflowY: "auto", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                {result.errors.map((e, i) => (
                  <div key={i} style={{
                    display: "flex", gap: "10px", padding: "8px 12px", alignItems: "flex-start",
                    borderBottom: i < result.errors.length - 1 ? "1px solid #f8fafc" : "none",
                    background: e.error.includes("skipped") ? "#fffbeb" : "#fef2f2",
                  }}>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 700, flexShrink: 0,
                      color: e.error.includes("skipped") ? "#d97706" : "#dc2626",
                      background: e.error.includes("skipped") ? "#fef3c7" : "#fee2e2",
                      borderRadius: "4px", padding: "1px 6px", marginTop: "1px",
                    }}>
                      Row {e.row}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "#374151" }}>{e.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff", border: "none", borderRadius: "8px",
              padding: "9px 20px", fontSize: "0.83rem", fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Import Another File
          </button>
        </div>
      )}
    </div>
  )
}
