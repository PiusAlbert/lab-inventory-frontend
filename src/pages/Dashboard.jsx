import { useEffect, useState, useCallback } from "react"
import { fetchDashboard } from "../services/dashboardApi"
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
    <div className="bg-white rounded-lg shadow p-6">
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

              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  type === "low"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Recent transactions</h3>
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

                <div className="text-right">
                  <span
                    className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                      isIssue
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
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
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetchDashboard()
      setData(res)
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

  if (loading) {
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
    total_items = 0,
    low_stock = 0,
    expiring_soon = 0,
    inventory_value = 0,
    stock_by_category = [],
    recent_transactions = [],
    low_stock_by_lab = [],
    expiring_by_lab = [],
    is_all_labs = false,
  } = data

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Items"
          value={total_items.toLocaleString()}
          subtitle={is_all_labs ? "Across all visible labs" : "Items tracked in selected lab"}
          variant="default"
        />

        <DashboardCard
          title="Low Stock"
          value={low_stock.toLocaleString()}
          subtitle="Items below minimum threshold"
          variant={low_stock > 0 ? "danger" : "success"}
        />

        <DashboardCard
          title="Expiring Soon"
          value={expiring_soon.toLocaleString()}
          subtitle="Batches due within 30 days"
          variant={expiring_soon > 0 ? "warning" : "success"}
        />

        <DashboardCard
          title="Inventory Value"
          value={formatCurrency(inventory_value)}
          subtitle="Based on current stock × unit price"
          variant="default"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <InventoryCharts data={stock_by_category} />
        </div>
        <div>
          <InventoryAlerts
            alerts={data}
            onReorder={() => {
              window.location.href = "/items?filter=low-stock"
            }}
            onReviewExpiring={() => {
              window.location.href = "/batches?filter=expiring"
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <InventoryInsights data={data} />
        </div>
        <div>
          <RecentTransactionsPanel rows={recent_transactions} />
        </div>
      </div>

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