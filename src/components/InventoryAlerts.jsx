/**
 * InventoryAlerts
 *
 * Props:
 *   alerts           — { low_stock, expiring_soon, low_stock_items[], expiring_batches[] }
 *   onReorder        — callback when user clicks Reorder on a low-stock alert
 *   onReviewExpiring — callback when user clicks Review on expiry alert
 */

export default function InventoryAlerts({
  alerts = null,
  onReorder,
  onReviewExpiring,
}) {

  if (alerts === null) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-base font-semibold mb-4">Inventory alerts</h3>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const { low_stock = 0, expiring_soon = 0 } = alerts
  const allHealthy = low_stock === 0 && expiring_soon === 0

  return (
    <div className="bg-white shadow rounded-lg p-6">

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Inventory alerts</h3>
      </div>

      <div className="space-y-3">

        {allHealthy && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-lg text-sm">
            <span>✔</span>
            <span>All inventory levels healthy</span>
          </div>
        )}

        {low_stock > 0 && (
          <div className="flex items-center justify-between bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            <span>⚠ {low_stock} items below minimum stock</span>
            <button
              onClick={onReorder}
              className="ml-3 text-xs font-medium px-3 py-1 rounded-full
                         border border-red-300 hover:bg-red-100 transition-colors flex-shrink-0"
            >
              Reorder
            </button>
          </div>
        )}

        {expiring_soon > 0 && (
          <div className="flex items-center justify-between bg-amber-50 text-amber-700 p-3 rounded-lg text-sm">
            <span>⏳ {expiring_soon} batches expiring within 30 days</span>
            <button
              onClick={onReviewExpiring}
              className="ml-3 text-xs font-medium px-3 py-1 rounded-full
                         border border-amber-300 hover:bg-amber-100 transition-colors flex-shrink-0"
            >
              Review
            </button>
          </div>
        )}

      </div>

      {/* Low stock items detail list */}
      {low_stock > 0 && alerts.low_stock_items?.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Low stock items
          </p>
          <div className="space-y-2">
            {alerts.low_stock_items.slice(0, 5).map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{item.sku}</span>
                </div>
                <span className="text-red-600 font-medium text-xs">
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