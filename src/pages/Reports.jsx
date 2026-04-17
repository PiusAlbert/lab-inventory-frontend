import { useState, useCallback } from "react"
import { fetchReport } from "../services/reportsApi"

const PERIODS = [
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "custom", label: "Custom Range" },
]

function StatCard({ label, value, sub, color = "#1d4ed8" }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        padding: "1.25rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <p
        style={{
          fontSize: "0.72rem",
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "1px",
          margin: "0 0 6px",
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: "2rem", fontWeight: 700, color, margin: "0 0 2px" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: 0 }}>{sub}</p>}
    </div>
  )
}

function SectionHeader({ title }) {
  return (
    <h3
      style={{
        fontSize: "0.78rem",
        fontWeight: 700,
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: "1px",
        margin: "0 0 0.75rem",
        paddingBottom: "0.5rem",
        borderBottom: "2px solid #e2e8f0",
      }}
    >
      {title}
    </h3>
  )
}

function Table({ headers, rows, emptyMsg = "No data" }) {
  if (!rows || rows.length === 0) {
    return (
      <p style={{ color: "#94a3b8", fontSize: "0.82rem", padding: "1rem 0" }}>
        {emptyMsg}
      </p>
    )
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  fontSize: "0.7rem",
                  color: "#94a3b8",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "8px 12px",
                    color: "#374151",
                    verticalAlign: "top",
                  }}
                >
                  {cell}
                </td>
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
    issue: { bg: "#fef2f2", color: "#dc2626" },
    receive: { bg: "#f0fdf4", color: "#16a34a" },
    low: { bg: "#fef3c7", color: "#d97706" },
    danger: { bg: "#fef2f2", color: "#dc2626" },
    ok: { bg: "#f0fdf4", color: "#16a34a" },
    neutral: { bg: "#f1f5f9", color: "#475569" },
  }

  const c = colors[type] || colors.neutral

  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        fontSize: "0.68rem",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "10px",
      }}
    >
      {label}
    </span>
  )
}

function btnStyle(bg, border, color) {
  return {
    background: bg,
    border: `1px solid ${border}`,
    color,
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
  }
}

function escapeCSV(value) {
  const str = value == null ? "" : String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function downloadCSV(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const [period, setPeriod] = useState("monthly")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setReport(null)

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

  const fmt = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—"

  const exportCSV = () => {
    if (!report) return

    const rows = [
      ["DECOHAS Labs — Inventory Report"],
      [
        `Period: ${report.summary.period} | ${fmt(report.summary.period_start)} → ${fmt(
          report.summary.period_end
        )}`,
      ],
      [],
      ["SUMMARY"],
      ["Metric", "Value"],
      ["Total items", report.summary.total_items],
      ["Low stock count", report.summary.low_stock_count],
      ["Out of stock count", report.summary.out_of_stock_count],
      ["Expiring soon count", report.summary.expiring_soon_count],
      ["Total transactions", report.summary.total_transactions],
      ["Total issued", report.summary.total_issued],
      ["Total received", report.summary.total_received],
      [],
      ["STOCK SNAPSHOT"],
      ["SKU", "Name", "Category", "Type", "Current Stock", "Unit", "Threshold", "Status"],
      ...report.stock_snapshot.map((i) => [
        i.sku,
        i.name,
        i.category,
        i.item_type,
        i.current_stock,
        i.unit_of_measure,
        i.minimum_threshold,
        i.current_stock === 0
          ? "Out of stock"
          : i.current_stock < i.minimum_threshold
            ? "Low stock"
            : "OK",
      ]),
      [],
      ["LOW STOCK ITEMS"],
      ["SKU", "Name", "Current", "Threshold", "Unit"],
      ...(report.low_stock_items || []).map((i) => [
        i.sku,
        i.name,
        i.current_stock,
        i.minimum_threshold,
        i.unit_of_measure,
      ]),
      [],
      ["EXPIRING BATCHES"],
      ["Item", "SKU", "Batch", "Expiry Date", "Days Left", "Available", "Unit"],
      ...(report.expiring_batches || []).map((b) => [
        b.item_name,
        b.sku,
        b.batch_number,
        b.expiry_date,
        b.days_to_expiry,
        b.current_quantity,
        b.unit_of_measure,
      ]),
      [],
      ["TRANSACTIONS"],
      ["Date", "Type", "Item", "SKU", "Quantity", "Batch", "Reference"],
      ...(report.transactions || []).map((t) => [
        new Date(t.created_at).toLocaleString(),
        t.transaction_type,
        t.items?.name || "",
        t.items?.sku || "",
        t.quantity,
        t.stock_batches?.batch_number || "",
        t.reference || "",
      ]),
      [],
      ["RECONCILIATION BY ITEM"],
      ["SKU", "Name", "Category", "Current Stock", "Net Movement", "Unit", "Status"],
      ...((report.reconciliation?.by_item || []).map((r) => [
        r.sku,
        r.name,
        r.category,
        r.current_stock,
        r.period_net_movement,
        r.unit_of_measure,
        r.status,
      ])),
      [],
      ["RECONCILIATION BY BATCH"],
      ["Item", "SKU", "Batch", "Received", "Available", "Issued Since Receipt", "Period Movement", "Unit"],
      ...((report.reconciliation?.by_batch || []).map((r) => [
        r.item_name,
        r.sku,
        r.batch_number,
        r.quantity_received,
        r.current_quantity,
        r.issued_since_receipt,
        r.period_net_movement,
        r.unit_of_measure,
      ])),
    ]

    downloadCSV(
      `inventory-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`,
      rows
    )
  }

  const exportExcelFriendlyCSV = () => {
    if (!report) return

    const rows = [
      ["DECOHAS Labs — Inventory Report (Excel-Friendly Export)"],
      [
        `Period`,
        report.summary.period,
        `From`,
        fmt(report.summary.period_start),
        `To`,
        fmt(report.summary.period_end),
      ],
      [],
      ["Summary"],
      ["Total items", report.summary.total_items],
      ["Low stock count", report.summary.low_stock_count],
      ["Out of stock count", report.summary.out_of_stock_count],
      ["Expiring soon count", report.summary.expiring_soon_count],
      ["Total transactions", report.summary.total_transactions],
      ["Total issued", report.summary.total_issued],
      ["Total received", report.summary.total_received],
      [],
      ["Stock Snapshot"],
      ["SKU", "Name", "Category", "Type", "Current Stock", "Unit", "Threshold", "Status"],
      ...report.stock_snapshot.map((i) => [
        i.sku,
        i.name,
        i.category,
        i.item_type,
        i.current_stock,
        i.unit_of_measure,
        i.minimum_threshold,
        i.status,
      ]),
      [],
      ["Transactions"],
      ["Date", "Type", "Item", "SKU", "Quantity", "Batch", "Reference", "Notes"],
      ...(report.transactions || []).map((t) => [
        new Date(t.created_at).toLocaleString(),
        t.transaction_type,
        t.items?.name || "",
        t.items?.sku || "",
        t.quantity,
        t.stock_batches?.batch_number || "",
        t.reference || "",
        t.notes || "",
      ]),
      [],
      ["Reconciliation By Item"],
      ["SKU", "Name", "Current Stock", "Net Movement", "Status"],
      ...(report.reconciliation?.by_item || []).map((r) => [
        r.sku,
        r.name,
        r.current_stock,
        r.period_net_movement,
        r.status,
      ]),
      [],
      ["Reconciliation By Batch"],
      ["Item", "Batch", "Received", "Available", "Issued Since Receipt", "Period Movement"],
      ...(report.reconciliation?.by_batch || []).map((r) => [
        r.item_name,
        r.batch_number,
        r.quantity_received,
        r.current_quantity,
        r.issued_since_receipt,
        r.period_net_movement,
      ]),
    ]

    downloadCSV(
      `inventory-report-excel-${period}-${new Date().toISOString().slice(0, 10)}.csv`,
      rows
    )
  }

  return (
    <div style={{ maxWidth: "1100px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
            Inventory Reports
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "4px 0 0" }}>
            Generate weekly, monthly, or custom stock, reconciliation, and transaction summaries
          </p>
        </div>

        {report && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={exportCSV} style={btnStyle("#fff", "#e2e8f0", "#374151")}>
              ↓ Export CSV
            </button>
            <button onClick={exportExcelFriendlyCSV} style={btnStyle("#fff", "#e2e8f0", "#374151")}>
              ↓ Excel CSV
            </button>
            <button onClick={print} style={btnStyle("#1d4ed8", "#1d4ed8", "#fff")}>
              🖨 Print
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "flex-end",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <label style={labelStyle}>Period</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                style={{
                  padding: "7px 16px",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  border: period === p.value ? "none" : "1px solid #e2e8f0",
                  background: period === p.value ? "#1d4ed8" : "#fff",
                  color: period === p.value ? "#fff" : "#475569",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {period === "custom" && (
          <>
            <div>
              <label style={labelStyle}>Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </>
        )}

        <button
          onClick={generate}
          disabled={loading || (period === "custom" && (!startDate || !endDate))}
          style={{
            ...btnStyle("#1d4ed8", "#1d4ed8", "#fff"),
            opacity: loading || (period === "custom" && (!startDate || !endDate)) ? 0.65 : 1,
            cursor: loading || (period === "custom" && (!startDate || !endDate)) ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            borderRadius: "10px",
            padding: "12px 14px",
            marginBottom: "1rem",
            fontSize: "0.84rem",
          }}
        >
          {error}
        </div>
      )}

      {report && (
        <div id="report-content">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "1.5rem" }}>
            <StatCard label="Items" value={report.summary.total_items} />
            <StatCard label="Low Stock" value={report.summary.low_stock_count} color="#d97706" />
            <StatCard label="Expiring Soon" value={report.summary.expiring_soon_count} color="#dc2626" />
            <StatCard label="Transactions" value={report.summary.total_transactions} color="#16a34a" />
          </div>

          <div style={sectionStyle}>
            <SectionHeader
              title={`Report Summary (${fmt(report.summary.period_start)} → ${fmt(report.summary.period_end)})`}
            />
            <Table
              headers={["Metric", "Value"]}
              rows={[
                ["Total items", report.summary.total_items],
                ["Low stock count", report.summary.low_stock_count],
                ["Out of stock count", report.summary.out_of_stock_count],
                ["Expiring soon count", report.summary.expiring_soon_count],
                ["Total transactions", report.summary.total_transactions],
                ["Total issued", report.summary.total_issued],
                ["Total received", report.summary.total_received],
                ["Scope", report.summary.is_all_labs ? "All visible labs" : "Selected laboratory"],
              ]}
            />
          </div>

          <div style={sectionStyle}>
            <SectionHeader title={`Full Stock Snapshot (${report.stock_snapshot.length} items)`} />
            <Table
              headers={["SKU", "Name", "Category", "Type", "Stock", "Unit", "Threshold", "Status"]}
              rows={report.stock_snapshot.map((i) => {
                const status =
                  i.current_stock === 0 ? (
                    <Badge label="Out of stock" type="danger" />
                  ) : i.current_stock < i.minimum_threshold ? (
                    <Badge label="Low stock" type="low" />
                  ) : (
                    <Badge label="OK" type="ok" />
                  )

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

          <div style={sectionStyle}>
            <SectionHeader title={`Low Stock Items (${(report.low_stock_items || []).length})`} />
            <Table
              headers={["SKU", "Name", "Current", "Threshold", "Unit"]}
              emptyMsg="No low-stock items in this report."
              rows={(report.low_stock_items || []).map((i) => [
                <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{i.sku}</span>,
                i.name,
                i.current_stock,
                i.minimum_threshold,
                i.unit_of_measure,
              ])}
            />
          </div>

          <div style={sectionStyle}>
            <SectionHeader title={`Expiring Batches (${(report.expiring_batches || []).length})`} />
            <Table
              headers={["Item", "SKU", "Batch", "Expiry", "Days Left", "Available", "Unit"]}
              emptyMsg="No expiring batches in this report."
              rows={(report.expiring_batches || []).map((b) => [
                b.item_name,
                <span style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{b.sku}</span>,
                <span style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{b.batch_number}</span>,
                fmt(b.expiry_date),
                b.days_to_expiry,
                b.current_quantity,
                b.unit_of_measure,
              ])}
            />
          </div>

          <div style={sectionStyle}>
            <SectionHeader title={`Transaction Log (${(report.transactions || []).length})`} />
            <Table
              headers={["Date", "Type", "Item", "SKU", "Qty", "Batch", "Reference"]}
              emptyMsg="No transactions in this period."
              rows={(report.transactions || []).map((t) => [
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

          <div style={sectionStyle}>
            <SectionHeader title={`Reconciliation by Item (${(report.reconciliation?.by_item || []).length})`} />
            <Table
              headers={["SKU", "Name", "Category", "Current Stock", "Net Movement", "Unit", "Status"]}
              emptyMsg="No reconciliation item data."
              rows={(report.reconciliation?.by_item || []).map((r) => [
                <span style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{r.sku}</span>,
                r.name,
                r.category,
                r.current_stock,
                r.period_net_movement,
                r.unit_of_measure,
                r.status === "LOW_STOCK" ? (
                  <Badge label="Low stock" type="low" />
                ) : r.status === "OUT_OF_STOCK" ? (
                  <Badge label="Out of stock" type="danger" />
                ) : (
                  <Badge label="OK" type="ok" />
                ),
              ])}
            />
          </div>

          <div style={sectionStyle}>
            <SectionHeader title={`Reconciliation by Batch (${(report.reconciliation?.by_batch || []).length})`} />
            <Table
              headers={["Item", "SKU", "Batch", "Received", "Available", "Issued Since Receipt", "Period Movement", "Unit"]}
              emptyMsg="No reconciliation batch data."
              rows={(report.reconciliation?.by_batch || []).map((r) => [
                r.item_name,
                <span style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{r.sku}</span>,
                <span style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{r.batch_number}</span>,
                r.quantity_received,
                r.current_quantity,
                r.issued_since_receipt,
                r.period_net_movement,
                r.unit_of_measure,
              ])}
            />
          </div>

          <div style={sectionStyle}>
            <SectionHeader title="Reconciliation Notes" />
            <ul style={{ margin: 0, paddingLeft: "18px", color: "#475569", fontSize: "0.82rem" }}>
              {(report.reconciliation?.notes || []).map((note, i) => (
                <li key={i} style={{ marginBottom: "6px" }}>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
  display: "block",
  marginBottom: "6px",
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "#64748b",
}

const inputStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  padding: "8px 10px",
  fontSize: "0.82rem",
  color: "#334155",
  background: "#fff",
}

const sectionStyle = {
  background: "#fff",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem",
  marginBottom: "1rem",
}