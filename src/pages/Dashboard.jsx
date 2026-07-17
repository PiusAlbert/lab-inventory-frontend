import { useEffect, useState, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { fetchDashboard } from "../services/dashboardApi"
import { useAuth } from "../context/AuthContext"
import DashboardCard from "../components/DashboardCard"
import InventoryCharts from "../components/InventoryCharts"
import InventoryAlerts from "../components/InventoryAlerts"
import InventoryInsights from "../components/InventoryInsights"

function formatCurrency(value) {
  return `TZS ${Number(value || 0).toLocaleString()}`
}

function LabAlertGroup({ title, rows = [], type = "low" }) {
  const emptyText =
    type === "low"
      ? "No low-stock alerts across the visible labs"
      : "No expiring-batch alerts across the visible labs"

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
      <h3 className="text-base font-semibold mb-4">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div
              key={`${row.laboratory_id}-${idx}`}
              className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {row.laboratory_name || row.laboratory_id || "Unknown laboratory"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {type === "low"
                    ? `${row.count} item${row.count !== 1 ? "s" : ""} below minimum threshold`
                    : `${row.count} batch${row.count !== 1 ? "es" : ""} expiring within 30 days`}
                </p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                type === "low" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
              }`}>
                {row.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RecentTransactionsPanel({ rows = [] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Recent transactions</h3>
        <Link
          to="/transactions"
          className="text-xs text-blue-600 font-medium hover:text-blue-800 transition-colors"
        >
          View all →
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">No recent transactions</p>
      ) : (
        <div className="space-y-3">
          {rows.map((trx) => {
            const isIssue = trx.transaction_type === "ISSUE"
            return (
              <div
                key={trx.id}
                className="flex items-start justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {trx.items?.name || "Unknown item"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {trx.items?.sku || "—"} · {trx.stock_batches?.batch_number || "No batch"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {trx.created_at ? new Date(trx.created_at).toLocaleString() : "—"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                    isIssue ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                  }`}>
                    {trx.transaction_type}
                  </span>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {Number(trx.quantity || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const Dashboard = () => {
  const navigate = useNavigate()
  const { appUser } = useAuth()

  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchDashboard()
      setData(res)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    window.addEventListener("labChanged", load)
    return () => window.removeEventListener("labChanged", load)
  }, [load])

  const firstName = appUser?.full_name?.split(" ")[0] || "there"
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  })()

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-500 text-sm">
        Loading dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-5">
        <p className="font-medium mb-1">Failed to load dashboard</p>
        <p className="text-sm text-red-500 mb-3">{error}</p>
        <button
          onClick={load}
          className="text-xs px-3 py-1.5 border border-red-300 rounded-lg hover:bg-red-100"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  const {
    total_items        = 0,
    low_stock          = 0,
    expiring_soon      = 0,
    inventory_value    = 0,
    stock_by_category  = [],
    recent_transactions= [],
    low_stock_by_lab   = [],
    expiring_by_lab    = [],
    is_all_labs        = false,
  } = data

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Here's what's happening in your laboratory today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                       border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50
                       disabled:opacity-50 transition-colors"
          >
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => navigate("/transactions")}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                     bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          ↓ Receive Stock
        </button>
        <button
          onClick={() => navigate("/transactions")}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                     bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          ↑ Issue Stock
        </button>
        <button
          onClick={() => navigate("/reports")}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                     bg-white border border-gray-200 text-gray-700 rounded-lg
                     hover:bg-gray-50 transition-colors"
        >
          📊 Reports
        </button>
        <button
          onClick={() => navigate("/items/new")}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                     bg-white border border-gray-200 text-gray-700 rounded-lg
                     hover:bg-gray-50 transition-colors"
        >
          + Add Item
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Items"
          value={total_items.toLocaleString()}
          subtitle={is_all_labs ? "Across all visible labs" : "Items tracked in selected lab"}
          variant="default"
          onClick={() => navigate("/items")}
        />
        <DashboardCard
          title="Low Stock"
          value={low_stock.toLocaleString()}
          subtitle="Items below minimum threshold"
          variant={low_stock > 0 ? "danger" : "success"}
          onClick={low_stock > 0 ? () => navigate("/items?filter=low-stock") : undefined}
        />
        <DashboardCard
          title="Expiring Soon"
          value={expiring_soon.toLocaleString()}
          subtitle="Batches due within 30 days"
          variant={expiring_soon > 0 ? "warning" : "success"}
          onClick={expiring_soon > 0 ? () => navigate("/items?filter=expiring") : undefined}
        />
        <DashboardCard
          title="Inventory Value"
          value={formatCurrency(inventory_value)}
          subtitle="Based on current stock × unit price"
          variant="default"
          onClick={() => navigate("/reports")}
        />
      </div>

      {/* CHARTS + ALERTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <InventoryCharts data={stock_by_category} />
        </div>
        <div>
          <InventoryAlerts
            alerts={data}
            onReorder={() => navigate("/items?filter=low-stock")}
            onReviewExpiring={() => navigate("/items?filter=expiring")}
          />
        </div>
      </div>

      {/* INSIGHTS + RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <InventoryInsights data={data} />
        </div>
        <div>
          <RecentTransactionsPanel rows={recent_transactions} />
        </div>
      </div>

      {/* PER-LAB BREAKDOWN — super admin only */}
      {is_all_labs && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <LabAlertGroup
            title="Low-stock alerts by laboratory"
            rows={low_stock_by_lab}
            type="low"
          />
          <LabAlertGroup
            title="Expiring-batch alerts by laboratory"
            rows={expiring_by_lab}
            type="expiring"
          />
        </div>
      )}
    </div>
  )
}

export default Dashboard
