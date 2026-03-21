import { useEffect, useState, useCallback } from "react"
import { fetchDashboard }   from "../services/dashboardApi"
import DashboardCard        from "../components/DashboardCard"
import InventoryCharts      from "../components/InventoryCharts"
import InventoryAlerts      from "../components/InventoryAlerts"
import InventoryInsights    from "../components/InventoryInsights"

const Dashboard = () => {

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

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
    // Re-fetch when admin switches lab via the Layout switcher
    window.addEventListener("labChanged", load)
    return () => window.removeEventListener("labChanged", load)
  }, [load])

  if (loading) return (
    <div className="flex justify-center items-center h-40 text-gray-500 text-sm">
      Loading dashboard...
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-5">
      <p className="font-medium mb-1">Failed to load dashboard</p>
      <p className="text-sm text-red-500 mb-3">{error}</p>
      <button onClick={load}
        className="text-xs px-3 py-1.5 border border-red-300 rounded-lg hover:bg-red-100">
        Retry
      </button>
    </div>
  )

  if (!data) return null

  return (
    <div className="space-y-8">

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Total Items"     value={data.total_items} />
        <DashboardCard title="Low Stock"       value={data.low_stock} />
        <DashboardCard title="Expiring Soon"   value={data.expiring_soon} />
        <DashboardCard title="Inventory Value" value={`$${data.inventory_value ?? 0}`} />
      </div>

      {/* ALERTS + INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryAlerts  alerts={data} />
        <InventoryInsights data={data} />
      </div>

      {/* CHART */}
      <InventoryCharts data={data.stock_by_category ?? null} />

      {/* RECENT TRANSACTIONS */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Recent Transactions
        </h3>

        {(!data.recent_transactions || data.recent_transactions.length === 0) ? (
          <p className="text-sm text-gray-400">No transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-xs text-gray-400 uppercase tracking-wider">
                  <th className="py-2 pr-4">Item</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Quantity</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_transactions.map(t => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-800">
                      {t.items?.name ?? "—"}
                    </td>
                    <td className="py-2 pr-4">
                      {t.transaction_type === "ISSUE" ? (
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">
                          Issue
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                          Receive
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-700">{t.quantity}</td>
                    <td className="py-2 text-gray-400 text-xs">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

export default Dashboard