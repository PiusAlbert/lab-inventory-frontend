import { useState, useCallback } from "react"
import { fetchReport } from "../services/reportsApi"

const PERIODS = [
  { value: "weekly",  label: "This Week"  },
  { value: "monthly", label: "This Month" },
  { value: "custom",  label: "Custom Range" },
]

function StatCard({ label, value, sub, color = "#1d4ed8" }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "10px",
      border: "1px solid #e2e8f0", padding: "1.25rem",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <p style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase",
                  letterSpacing: "1px", margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: "2rem", fontWeight: 700, color, margin: "0 0 2px" }}>{value}</p>
      {sub && <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: 0 }}>{sub}</p>}
    </div>
  )
}

function SectionHeader({ title }) {
  return (
    <h3 style={{
      fontSize: "0.78rem", fontWeight: 700, color: "#475569",
      textTransform: "uppercase", letterSpacing: "1px",
      margin: "0 0 0.75rem", paddingBottom: "0.5rem",
      borderBottom: "2px solid #e2e8f0",
    }}>{title}</h3>
  )
}

function Table({ headers, rows, emptyMsg = "No data" }) {
  if (!rows || rows.length === 0) {
    return <p style={{ color: "#94a3b8", fontSize: "0.82rem", padding: "1rem 0" }}>{emptyMsg}</p>
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {headers.map(h => (
              <th key={h} style={{
                textAlign: "left", padding: "8px 12px",
                fontSize: "0.7rem", color: "#94a3b8",
                fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.5px",
                borderBottom: "1px solid #e2e8f0",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: "8px 12px", color: "#374151",
                  verticalAlign: "top",
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Badge({ label, type }) {
  const colors = {
    issue:   { bg: "#fef2f2", color: "#dc2626" },
    receive: { bg: "#f0fdf4", color: "#16a34a" },
    low:     { bg: "#fef3c7", color: "#d97706" },
    danger:  { bg: "#fef2f2", color: "#dc2626" },
    ok:      { bg: "#f0fdf4", color: "#16a34a" },
  }
  const c = colors[type] || { bg: "#f1f5f9", color: "#475569" }
  return (
    <span style={{
      background: c.bg, color: c.color,
      fontSize: "0.68rem", fontWeight: 600,
      padding: "2px 8px", borderRadius: "10px",
    }}>{label}</span>
  )
}

export default function Reports() {
  const [period,     setPeriod]     = useState("monthly")
  const [startDate,  setStartDate]  = useState("")
  const [endDate,    setEndDate]    = useState("")
  const [report,     setReport]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

  const generate = useCallback(async () => {
    setLoading(true); setError(null); setReport(null)
    try {
      const data = await fetchReport(period, startDate || null, endDate || null)
      setReport(data)
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to generate report")
    } finally {
      setLoading(false)
    }
  }, [period, startDate, endDate])

  const print = () => window.print()

  const exportCSV = () => {
    if (!report) return
    const rows = [
      ["DECOHAS Labs — Inventory Report"],
      [`Period: ${report.summary.period} | ${fmt(report.summary.period_start)} → ${fmt(report.summary.period_end)}`],
      [],
      ["STOCK SNAPSHOT"],
      ["SKU", "Name", "Category", "Type", "Current Stock", "Unit", "Threshold", "Status"],
      ...report.stock_snapshot.map(i => [
        i.sku, i.name, i.category, i.item_type,
        i.current_stock, i.unit_of_measure, i.minimum_threshold,
        i.current_stock === 0 ? "Out of stock" :
        i.current_stock < i.minimum_threshold ? "Low stock" : "OK"
      ]),
      [],
      ["TRANSACTIONS"],
      ["Date", "Type", "Item", "SKU", "Quantity", "Reference"],
      ...(report.transactions || []).map(t => [
        new Date(t.created_at).toLocaleString(),
        t.transaction_type,
        t.items?.name,
        t.items?.sku,
        t.quantity,
        t.reference || "",
      ]),
    ]
    const csv  = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `inventory-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric"
  }) : "—"

  return (
    <div style={{ maxWidth: "1100px" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
            Inventory Reports
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "4px 0 0" }}>
            Generate weekly or monthly stock and transaction summaries
          </p>
        </div>
        {report && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={exportCSV} style={btnStyle("#fff", "#e2e8f0", "#374151")}>
              ↓ Export CSV
            </button>
            <button onClick={print} style={btnStyle("#1d4ed8", "#1d4ed8", "#fff")}>
              🖨 Print
            </button>
          </div>
        )}
      </div>

      {/* ── CONTROLS ── */}
      <div style={{
        background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0",
        padding: "1.25rem", marginBottom: "1.5rem",
        display: "flex", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap",
      }}>
        <div>
          <label style={labelStyle}>Period</label>
          <div style={{ display: "flex", gap: "6px" }}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                style={{
                  padding: "7px 16px", borderRadius: "8px", fontSize: "0.82rem",
                  fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                  border: period === p.value ? "none" : "1px solid #e2e8f0",
                  background: period === p.value ? "#1d4ed8" : "#fff",
                  color:      period === p.value ? "#fff"    : "#374151",
                }}
              >{p.label}</button>
            ))}
          </div>
        </div>

        {period === "custom" && (
          <>
            <div>
              <label style={labelStyle}>From</label>
              <input type="date" value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>To</label>
              <input type="date" value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={inputStyle} />
            </div>
          </>
        )}

        <button
          onClick={generate}
          disabled={loading || (period === "custom" && (!startDate || !endDate))}
          style={{
            ...btnStyle("#16a34a", "#16a34a", "#fff"),
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Generating…" : "Generate Report"}
        </button>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca",
          color: "#dc2626", borderRadius: "8px",
          padding: "12px 16px", marginBottom: "1.5rem", fontSize: "0.85rem",
        }}>{error}</div>
      )}

      {/* ── REPORT OUTPUT ── */}
      {report && (
        <div id="report-content" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Report title */}
          <div style={{
            background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
            borderRadius: "10px", padding: "1.5rem",
            color: "#fff",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.72rem", opacity: 0.7,
                        textTransform: "uppercase", letterSpacing: "1px" }}>
              DECOHAS Labs · Inventory Report
            </p>
            <h3 style={{ margin: "0 0 6px", fontSize: "1.4rem", fontWeight: 700 }}>
              {report.summary.period === "weekly"  ? "Weekly Summary"  :
               report.summary.period === "monthly" ? "Monthly Summary" : "Custom Period"}
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.8 }}>
              {fmt(report.summary.period_start)} — {fmt(report.summary.period_end)}
            </p>
          </div>

          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
            <StatCard label="Total Items"       value={report.summary.total_items} />
            <StatCard label="Low Stock"         value={report.summary.low_stock_count}
                      color={report.summary.low_stock_count > 0 ? "#d97706" : "#16a34a"} />
            <StatCard label="Out of Stock"      value={report.summary.out_of_stock_count}
                      color={report.summary.out_of_stock_count > 0 ? "#dc2626" : "#16a34a"} />
            <StatCard label="Expiring Soon"     value={report.summary.expiring_soon_count}
                      color={report.summary.expiring_soon_count > 0 ? "#d97706" : "#16a34a"} />
            <StatCard label="Transactions"      value={report.summary.total_transactions} color="#7c3aed" />
            <StatCard label="Total Issued"      value={report.summary.total_issued}    color="#dc2626" />
            <StatCard label="Total Received"    value={report.summary.total_received}  color="#16a34a" />
          </div>

          {/* Category breakdown */}
          <div style={sectionStyle}>
            <SectionHeader title="Category Breakdown" />
            <Table
              headers={["Category", "Items", "Total Stock", "Low Stock"]}
              rows={report.category_breakdown.map(c => [
                c.category,
                c.total_items,
                c.total_stock,
                c.low_stock > 0
                  ? <Badge label={`${c.low_stock} items`} type="low" />
                  : <Badge label="All OK" type="ok" />,
              ])}
            />
          </div>

          {/* Low stock items */}
          {report.low_stock_items.length > 0 && (
            <div style={{ ...sectionStyle, border: "1px solid #fde68a" }}>
              <SectionHeader title={`⚠ Low Stock Items (${report.low_stock_items.length})`} />
              <Table
                headers={["SKU", "Name", "Category", "Type", "Current Stock", "Min Threshold", "Unit"]}
                rows={report.low_stock_items.map(i => [
                  <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{i.sku}</span>,
                  i.name,
                  i.category,
                  i.item_type,
                  <strong style={{ color: i.current_stock === 0 ? "#dc2626" : "#d97706" }}>
                    {i.current_stock}
                  </strong>,
                  i.minimum_threshold,
                  i.unit_of_measure,
                ])}
              />
            </div>
          )}

          {/* Expiry alerts */}
          {report.expiry_alerts.length > 0 && (
            <div style={{ ...sectionStyle, border: "1px solid #fca5a5" }}>
              <SectionHeader title={`⛔ Expiry Alerts (${report.expiry_alerts.length})`} />
              <Table
                headers={["SKU", "Name", "Expiring Batches", "Expired Batches"]}
                rows={report.expiry_alerts.map(i => [
                  <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{i.sku}</span>,
                  i.name,
                  i.expiring_soon > 0
                    ? <Badge label={`${i.expiring_soon} batch${i.expiring_soon > 1 ? "es" : ""}`} type="low" />
                    : "—",
                  i.expired > 0
                    ? <Badge label={`${i.expired} batch${i.expired > 1 ? "es" : ""}`} type="danger" />
                    : "—",
                ])}
              />
            </div>
          )}

          {/* Top issued items */}
          {report.top_issued_items.length > 0 && (
            <div style={sectionStyle}>
              <SectionHeader title="Top Issued Items (Period)" />
              <Table
                headers={["Rank", "SKU", "Name", "Total Issued", "Transactions"]}
                rows={report.top_issued_items.map((i, idx) => [
                  <strong style={{ color: "#94a3b8" }}>#{idx + 1}</strong>,
                  <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{i.sku}</span>,
                  i.name,
                  <strong style={{ color: "#dc2626" }}>{i.qty}</strong>,
                  i.count,
                ])}
              />
            </div>
          )}

          {/* Full stock snapshot */}
          <div style={sectionStyle}>
            <SectionHeader title={`Full Stock Snapshot (${report.stock_snapshot.length} items)`} />
            <Table
              headers={["SKU", "Name", "Category", "Type", "Stock", "Unit", "Threshold", "Status"]}
              rows={report.stock_snapshot.map(i => {
                const status =
                  i.current_stock === 0            ? <Badge label="Out of stock" type="danger" /> :
                  i.current_stock < i.minimum_threshold ? <Badge label="Low stock"    type="low"    /> :
                                                     <Badge label="OK"           type="ok"     />
                return [
                  <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{i.sku}</span>,
                  i.name,
                  i.category,
                  i.item_type,
                  i.current_stock,
                  i.unit_of_measure,
                  i.minimum_threshold,
                  status,
                ]
              })}
            />
          </div>

          {/* Transaction log */}
          <div style={sectionStyle}>
            <SectionHeader title={`Transaction Log (${(report.transactions || []).length})`} />
            <Table
              headers={["Date", "Type", "Item", "SKU", "Qty", "Batch", "Reference"]}
              emptyMsg="No transactions in this period."
              rows={(report.transactions || []).map(t => [
                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  {new Date(t.created_at).toLocaleString()}
                </span>,
                <Badge
                  label={t.transaction_type}
                  type={t.transaction_type === "ISSUE" ? "issue" : "receive"}
                />,
                t.items?.name ?? "—",
                <span style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>
                  {t.items?.sku ?? "—"}
                </span>,
                t.quantity,
                <span style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>
                  {t.stock_batches?.batch_number ?? "—"}
                </span>,
                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  {t.reference ?? "—"}
                </span>,
              ])}
            />
          </div>

        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-content, #report-content * { visibility: visible; }
          #report-content { position: absolute; left: 0; top: 0; width: 100%; }
          button { display: none !important; }
        }
      `}</style>

    </div>
  )
}

const labelStyle = {
  display: "block", fontSize: "0.72rem", fontWeight: 600,
  color: "#64748b", marginBottom: "6px", textTransform: "uppercase",
  letterSpacing: "0.5px",
}
const inputStyle = {
  border: "1.5px solid #e2e8f0", borderRadius: "8px",
  padding: "8px 12px", fontSize: "0.85rem", color: "#374151",
  outline: "none",
}
const sectionStyle = {
  background: "#fff", borderRadius: "10px",
  border: "1px solid #e2e8f0", padding: "1.25rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
}
const btnStyle = (bg, border, color) => ({
  background: bg, border: `1px solid ${border}`, color,
  borderRadius: "8px", padding: "8px 18px",
  fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
})