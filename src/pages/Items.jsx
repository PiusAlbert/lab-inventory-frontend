import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { fetchItems, deleteItem } from "../services/itemsApi"
import { fetchCategories } from "../services/categoriesApi"
import { useAuth } from "../context/AuthContext"
import IssueStockModal from "../components/IssueStockModal"
import ReceiveStockModal from "../components/ReceiveStockModal"

const TYPE_BADGE = {
  CHEMICAL: "bg-blue-50 text-blue-700",
  EQUIPMENT: "bg-teal-50 text-teal-700",
  CONSUMABLE: "bg-gray-100 text-gray-600",
  CRM: "bg-purple-50 text-purple-700",
}

const HAZARD_BADGE = {
  Corrosive: "bg-orange-50 text-orange-700",
  Flammable: "bg-red-50 text-red-700",
  "Non-Hazardous": "bg-green-50 text-green-700",
  Oxidizer: "bg-purple-50 text-purple-700",
  Other: "bg-gray-50 text-gray-500",
}

export default function Items() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAdmin, requiresLabSelection } = useAuth()

  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("")

  const [issueModal, setIssueModal] = useState(null)
  const [receiveModal, setReceiveModal] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const labRequired = isAdmin && requiresLabSelection

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [itemData, catData] = await Promise.all([
        fetchItems(),
        fetchCategories(),
      ])

      setItems(Array.isArray(itemData) ? itemData : [])
      setCategories(Array.isArray(catData) ? catData : [])
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load items")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    window.addEventListener("labChanged", load)
    return () => window.removeEventListener("labChanged", load)
  }, [load])

  useEffect(() => {
    const defaultFilter = searchParams.get("filter")
    if (defaultFilter === "low-stock") {
      setSearch("")
    }
  }, [searchParams])

  const guardedAction = (fn) => {
    if (labRequired) return
    fn()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      await deleteItem(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete item")
    } finally {
      setDeleting(false)
    }
  }

  const filtered = Array.isArray(items)
    ? items.filter((item) => {
        const q = search.toLowerCase()
        const matchSearch =
          !search ||
          item.name?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q)

        const matchCat = !catFilter || item.category_id === catFilter

        if (searchParams.get("filter") === "low-stock") {
          return matchSearch && matchCat && Boolean(item.is_low_stock || item.low_stock)
        }

        return matchSearch && matchCat
      })
    : []

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-500 text-sm">
        Loading items...
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-5">
        <p className="font-medium mb-1">Failed to load items</p>
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

  return (
    <div className="space-y-5">
      {labRequired && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4">
          <p className="font-medium text-sm mb-1">Select a laboratory first</p>
          <p className="text-sm">
            As Super Admin, you can review inventory across labs, but to add items,
            edit items, receive stock, issue stock, or delete records, you must first
            choose a laboratory from the top bar.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Items</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={() => guardedAction(() => navigate("/items/new"))}
          disabled={labRequired}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            labRequired
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          title={labRequired ? "Select a laboratory first" : "Add item"}
        >
          ＋ Add item
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:w-64"
        />

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:w-56"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Hazard</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className="border-b border-gray-50 hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    {item.barcode && (
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">
                        {item.barcode}
                      </p>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3 font-mono text-gray-500">
                  {item.sku}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      TYPE_BADGE[item.item_type] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.item_type}
                  </span>
                </td>

                <td className="px-4 py-3 text-gray-600">
                  {categories.find((c) => c.id === item.category_id)?.name ||
                    item.categories?.name ||
                    "—"}
                </td>

                <td className="px-4 py-3">
                  {item.hazard_class ? (
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        HAZARD_BADGE[item.hazard_class] || "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {item.hazard_class}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/items/${item.id}`)}
                      className="text-xs px-2.5 py-1 border border-gray-200 rounded hover:bg-gray-50"
                    >
                      View
                    </button>

                    <button
                      onClick={() => guardedAction(() => navigate(`/items/${item.id}/edit`))}
                      disabled={labRequired}
                      title={labRequired ? "Select a laboratory first" : "Edit item"}
                      className={`text-xs px-2.5 py-1 rounded border ${
                        labRequired
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-blue-100 text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => guardedAction(() => setReceiveModal(item))}
                      disabled={labRequired}
                      title={labRequired ? "Select a laboratory first" : "Receive stock"}
                      className={`text-xs px-2.5 py-1 rounded border ${
                        labRequired
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-green-100 text-green-600 hover:bg-green-50"
                      }`}
                    >
                      Receive
                    </button>

                    <button
                      onClick={() => guardedAction(() => setIssueModal(item))}
                      disabled={labRequired}
                      title={labRequired ? "Select a laboratory first" : "Issue stock"}
                      className={`text-xs px-2.5 py-1 rounded border ${
                        labRequired
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-amber-100 text-amber-600 hover:bg-amber-50"
                      }`}
                    >
                      Issue
                    </button>

                    <button
                      onClick={() => guardedAction(() => setDeleteTarget(item))}
                      disabled={labRequired}
                      title={labRequired ? "Select a laboratory first" : "Delete item"}
                      className={`text-xs px-2.5 py-1 rounded border ${
                        labRequired
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-red-100 text-red-600 hover:bg-red-50"
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {issueModal && (
        <IssueStockModal
          itemId={issueModal.id}
          itemName={issueModal.name}
          onClose={() => setIssueModal(null)}
          onSuccess={load}
        />
      )}

      {receiveModal && (
        <ReceiveStockModal
          itemId={receiveModal.id}
          itemName={receiveModal.name}
          onClose={() => setReceiveModal(null)}
          onSuccess={load}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[1000]">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-2">
              Delete item
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <b>{deleteTarget.name}</b>?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 text-sm border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}