import { useMemo, useState } from "react";
import { useDashboardData, type DashboardFilters, type DashboardSortBy } from "../hooks/useDashboardData";

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

export default function DashboardOptimized() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<DashboardSortBy>("name");

  const pageSize = 25;

  const filters = useMemo<DashboardFilters>(
    () => ({
      search,
      lowStockOnly,
      expiringDays: 30,
      sortBy,
      sortDir: sortBy === "name" ? "asc" : "desc",
    }),
    [search, lowStockOnly, sortBy]
  );

  const { items, metrics, meta, loading, error, refetch } = useDashboardData({
    page,
    pageSize,
    filters,
  });

  function applySearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function applyLowStock(value: boolean) {
    setLowStockOnly(value);
    setPage(1);
  }

  return (
    <main className="p-6 space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard title="Items" value={numberFormatter.format(metrics.totalItems)} />
        <MetricCard title="Low Stock" value={numberFormatter.format(metrics.lowStockItems)} />
        <MetricCard title="Expiring Soon" value={numberFormatter.format(metrics.expiringItems)} />
        <MetricCard title="Inventory Value" value={currencyFormatter.format(metrics.totalInventoryValue)} />
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={search}
              onChange={(event) => applySearch(event.target.value)}
              placeholder="Search item name or SKU"
              className="w-full rounded-lg border px-3 py-2 md:w-80"
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(event) => applyLowStock(event.target.checked)}
              />
              Low stock only
            </label>

            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as DashboardSortBy);
                setPage(1);
              }}
              className="rounded-lg border px-3 py-2"
            >
              <option value="name">Sort by name</option>
              <option value="current_stock">Sort by stock</option>
              <option value="minimum_threshold">Sort by threshold</option>
              <option value="created_at">Sort by newest</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="py-12 text-center text-sm text-gray-500">
            Loading optimized dashboard data…
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Current Stock</th>
                    <th className="px-4 py-3 text-right">Threshold</th>
                    <th className="px-4 py-3 text-right">Value</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3">{item.sku}</td>
                      <td className="px-4 py-3">{item.categoryName ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {numberFormatter.format(item.currentStock)} {item.unitOfMeasure}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {numberFormatter.format(item.minimumThreshold)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {currencyFormatter.format(item.inventoryValue)}
                      </td>
                      <td className="px-4 py-3">
                        {item.isLowStock ? (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                            Low by {numberFormatter.format(item.shortage)}
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                        No inventory records match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span>
                Page {meta.page} of {meta.totalPages || 1} · {meta.totalItems} records
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!meta.hasPreviousPage}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  );
}
