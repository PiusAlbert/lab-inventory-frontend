/**
 * InventoryInsights
 *
 * Receives the full dashboard data object:
 *   total_items, low_stock, expiring_soon, inventory_value,
 *   low_stock_items[], expiring_batches[], stock_by_category[],
 *   recent_transactions[], is_all_labs
 */

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
}

function HealthScore({ total, lowStock, expiring }) {
  if (!total) return null

  const lowPct    = (lowStock  / total) * 100
  const expiryPct = (expiring  / total) * 100
  const penalty   = Math.min(100, lowPct * 1.5 + expiryPct)
  const score     = Math.max(0, Math.round(100 - penalty))

  const { color, label, bg } =
    score >= 80 ? { color: "text-green-600",  bg: "bg-green-100",  label: "Healthy"  } :
    score >= 50 ? { color: "text-amber-600",  bg: "bg-amber-100",  label: "Moderate" } :
                  { color: "text-red-600",    bg: "bg-red-100",    label: "Critical" }

  return (
    <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${bg}`}>
      <div>
        <p className="text-xs font-medium text-gray-500">Inventory health</p>
        <p className={`text-2xl font-bold mt-0.5 ${color}`}>{score}%</p>
      </div>
      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${bg} ${color} border border-current border-opacity-30`}>
        {label}
      </span>
    </div>
  )
}

function StatRow({ icon, label, value, sub, valueColor = "text-gray-800" }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className="text-base">{icon}</span>
        <div>
          <p className="text-sm text-gray-700">{label}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      <span className={`text-sm font-semibold ${valueColor}`}>{value}</span>
    </div>
  )
}

export default function InventoryInsights({ data }) {

  if (!data) return (
    <div className="bg-white shadow rounded-lg p-6 text-sm text-gray-400">
      No data available
    </div>
  )

  const {
    total_items        = 0,
    low_stock          = 0,
    expiring_soon      = 0,
    inventory_value    = 0,
    low_stock_items    = [],
    expiring_batches   = [],
    stock_by_category  = [],
    is_all_labs        = false,
  } = data

  // Top category by quantity
  const topCategory = stock_by_category[0] ?? null

  // Most urgent expiry
  const nextExpiry = expiring_batches
    .filter(b => b.expiry_date)
    .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))[0] ?? null

  const nextExpiryDays = nextExpiry ? daysUntil(nextExpiry.expiry_date) : null

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-5">

      <h3 className="text-base font-semibold text-gray-800">
        Inventory Insights
        {is_all_labs && (
          <span className="ml-2 text-xs font-medium text-purple-600 bg-purple-50
                           px-2 py-0.5 rounded-full">
            All labs
          </span>
        )}
      </h3>

      {/* HEALTH SCORE */}
      <HealthScore
        total={total_items}
        lowStock={low_stock}
        expiring={expiring_soon}
      />

      {/* KEY STATS */}
      <div>
        <StatRow
          icon="📦"
          label="Total items tracked"
          value={total_items}
        />
        <StatRow
          icon="⚠️"
          label="Below minimum threshold"
          sub="Items needing restock"
          value={low_stock}
          valueColor={low_stock > 0 ? "text-red-600" : "text-green-600"}
        />
        <StatRow
          icon="⏳"
          label="Batches expiring soon"
          sub="Within the next 30 days"
          value={expiring_soon}
          valueColor={expiring_soon > 0 ? "text-amber-600" : "text-green-600"}
        />
        <StatRow
          icon="💰"
          label="Estimated inventory value"
          value={`$${Number(inventory_value).toLocaleString()}`}
        />
        {topCategory && (
          <StatRow
            icon="🏷️"
            label="Largest category"
            sub={`${topCategory.total_quantity} units in stock`}
            value={topCategory.category}
            valueColor="text-blue-600"
          />
        )}
        {nextExpiry && nextExpiryDays !== null && (
          <StatRow
            icon="🗓️"
            label="Most urgent expiry"
            sub={nextExpiry.items?.name ?? "Unknown item"}
            value={nextExpiryDays <= 0 ? "Expired" : `${nextExpiryDays}d left`}
            valueColor={nextExpiryDays <= 7 ? "text-red-600" : "text-amber-600"}
          />
        )}
      </div>

      {/* TOP LOW STOCK ITEMS */}
      {low_stock_items.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Critical items
          </p>
          <div className="space-y-1.5">
            {low_stock_items.slice(0, 5).map(item => {
              const pct = item.minimum_threshold > 0
                ? Math.min(100, (item.current_stock / item.minimum_threshold) * 100)
                : 0
              return (
                <div key={item.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-700 truncate max-w-[65%]">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.current_stock}
                      <span className="text-gray-400">
                        /{item.minimum_threshold} {item.unit_of_measure}
                      </span>
                    </p>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct === 0   ? "bg-red-500"   :
                        pct < 50   ? "bg-amber-400" :
                                     "bg-green-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* EXPIRING BATCHES PREVIEW */}
      {expiring_batches.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Expiring batches
          </p>
          <div className="space-y-1.5">
            {expiring_batches.slice(0, 4).map(batch => {
              const days = daysUntil(batch.expiry_date)
              return (
                <div key={batch.id}
                  className="flex items-center justify-between text-xs">
                  <p className="text-gray-700 truncate max-w-[65%]">
                    {batch.items?.name ?? "Unknown"}
                  </p>
                  <span className={`font-medium px-2 py-0.5 rounded-full ${
                    days <= 0  ? "bg-red-100 text-red-700"    :
                    days <= 7  ? "bg-red-50 text-red-600"     :
                    days <= 14 ? "bg-amber-50 text-amber-700" :
                                 "bg-gray-100 text-gray-500"
                  }`}>
                    {days <= 0 ? "Expired" : `${days}d`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ALL CLEAR */}
      {low_stock === 0 && expiring_soon === 0 && total_items > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3
                        text-sm text-green-700 flex items-center gap-2">
          <span>✅</span>
          <span>All stock levels are healthy. No action needed.</span>
        </div>
      )}

    </div>
  )
}