import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { fetchItems, deleteItem } from "../services/itemsApi"
import { fetchCategories }        from "../services/categoriesApi"
import IssueStockModal            from "../components/IssueStockModal"
import ReceiveStockModal          from "../components/ReceiveStockModal"

const TYPE_BADGE = {
  CHEMICAL:   "bg-blue-50 text-blue-700",
  EQUIPMENT:  "bg-teal-50 text-teal-700",
  CONSUMABLE: "bg-gray-100 text-gray-600",
  CRM:        "bg-purple-50 text-purple-700",
}

const HAZARD_BADGE = {
  "Corrosive":     "bg-orange-50 text-orange-700",
  "Flammable":     "bg-red-50 text-red-700",
  "Non-Hazardous": "bg-green-50 text-green-700",
  "Oxidizer":      "bg-purple-50 text-purple-700",
  "Other":         "bg-gray-50 text-gray-500",
}

export default function Items() {

  const [searchParams]              = useSearchParams()
  const navigate                    = useNavigate()
  const [items,      setItems]      = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [search,     setSearch]     = useState("")
  const [catFilter,  setCatFilter]  = useState("")
  const [issueModal,   setIssueModal]   = useState(null)
  const [receiveModal, setReceiveModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [itemData, catData] = await Promise.all([fetchItems(), fetchCategories()])
      setItems(Array.isArray(itemData) ? itemData : [])
      setCategories(Array.isArray(catData) ? catData : [])
    } catch (err) {
      setError(err.message || "Failed to load items")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // Re-fetch when admin switches lab
    window.addEventListener("labChanged", load)
    return () => window.removeEventListener("labChanged", load)
  }, [load])

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
    ? items.filter(item => {
        const q = search.toLowerCase()
        const matchSearch = !search ||
          item.name?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q)
        const matchCat = !catFilter || item.category_id === catFilter
        return matchSearch && matchCat
      })
    : []

  return (
    <div className="space-y-5">

      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Items</h2>
          <p className="text-xs text-gray-400 mt-0.5">{items.length} items</p>
        </div>
        <button
          onClick={() => navigate("/items/new")}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                     bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors self-start"
        >
          ＋ Add item
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4
                      flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-60
                     focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-600"
        >
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {(search || catFilter) && (
          <button onClick={() => { setSearch(""); setCatFilter("") }}
            className="text-xs text-gray-400 hover:text-gray-600 underline">
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading && (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10
                        text-center text-sm text-gray-400">Loading items...</div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <p className="text-sm font-medium text-red-700 mb-1">Failed to load items</p>
          <p className="text-xs text-red-500 mb-3">{error}</p>
          <button onClick={load}
            className="text-xs px-3 py-1.5 border border-red-300 rounded-lg
                       text-red-700 hover:bg-red-100 transition-colors">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10
                        text-center text-sm text-gray-400">
          {items.length === 0 ? "No items found." : "No items match your search or filter."}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">SKU</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-left px-4 py-3">Hazard</th>
                  <th className="text-left px-4 py-3">Unit</th>
                  <th className="text-left px-4 py-3">Min.</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(item => (
                  <tr key={item.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/items/${item.id}`)}>

                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      {item.storage_condition && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.storage_condition}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.sku}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                                       ${TYPE_BADGE[item.item_type] ?? "bg-gray-50 text-gray-500"}`}>
                        {item.item_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {item.categories?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {item.hazard_class ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                                         ${HAZARD_BADGE[item.hazard_class] ?? "bg-gray-50 text-gray-500"}`}>
                          {item.hazard_class}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{item.unit_of_measure}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{item.minimum_threshold}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setReceiveModal({ itemId: item.id, itemName: item.name })}
                          className="text-xs px-2 py-1 border border-gray-200 rounded
                                     text-green-700 hover:bg-green-50 transition-colors">
                          Receive
                        </button>
                        <button onClick={() => setIssueModal({ itemId: item.id, itemName: item.name })}
                          className="text-xs px-2 py-1 border border-gray-200 rounded
                                     text-amber-700 hover:bg-amber-50 transition-colors">
                          Issue
                        </button>
                        <button onClick={() => navigate(`/items/${item.id}`)}
                          className="text-xs px-2 py-1 border border-gray-200 rounded
                                     text-gray-600 hover:bg-gray-50 transition-colors">
                          View
                        </button>
                        <button onClick={() => setDeleteTarget(item)}
                          className="text-xs px-2 py-1 border border-red-100 rounded
                                     text-red-500 hover:bg-red-50 transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Delete item</h3>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-800">{deleteTarget.name}</span>?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg
                           hover:bg-red-700 disabled:opacity-60">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {issueModal && (
        <IssueStockModal {...issueModal} onClose={() => setIssueModal(null)} onSuccess={load} />
      )}
      {receiveModal && (
        <ReceiveStockModal {...receiveModal} onClose={() => setReceiveModal(null)} onSuccess={load} />
      )}

    </div>
  )
}