export default function InventoryAlerts({
  alerts = null,
  onReorder,
  onReviewExpiring,
}) {

  if (alerts === null) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-semibold mb-4">Inventory alerts</h3>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const { low_stock = 0, expiring_soon = 0 } = alerts
  const allHealthy = low_stock === 0 && expiring_soon === 0

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
      <h3 className="text-base font-semibold mb-4">Inventory alerts</h3>

      <div className="space-y-3">

        {allHealthy && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
            <span>✔</span>
            <span>All inventory levels healthy</span>
          </div>
        )}

        {low_stock > 0 && (
          <div className="bg-red-50 rounded-lg px-4 py-3 space-y-2.5">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <span>⚠</span>
              <span className="font-medium">{low_stock} items below minimum stock</span>
            </div>
            <button
              onClick={onReorder}
              className="text-xs font-medium px-3 py-1.5 border border-red-200 rounded-lg
                         bg-white text-red-600 hover:bg-red-50 transition-colors"
            >
              View items →
            </button>
          </div>
        )}

        {expiring_soon > 0 && (
          <div className="bg-amber-50 rounded-lg px-4 py-3 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <span>⏳</span>
              <span className="font-medium">{expiring_soon} batches expiring within 30 days</span>
            </div>
            <button
              onClick={onReviewExpiring}
              className="text-xs font-medium px-3 py-1.5 border border-amber-200 rounded-lg
                         bg-white text-amber-600 hover:bg-amber-50 transition-colors"
            >
              Review batches →
            </button>
          </div>
        )}

      </div>

      {/* Low stock items detail list */}
      {low_stock > 0 && alerts.low_stock_items?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Low stock items
          </p>
          <div className="space-y-2">
            {alerts.low_stock_items.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{item.sku}</span>
                </div>
                <span className="text-red-600 font-medium text-xs flex-shrink-0 ml-2">
                  {item.current_stock} / {item.minimum_threshold} {item.unit_of_measure}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
