import { useEffect, useState, useCallback } from "react"
import { fetchTransactions } from "../services/transactionsApi"
import IssueStockModal    from "../components/IssueStockModal"
import ReceiveStockModal  from "../components/ReceiveStockModal"

const TYPE_STYLES = {
  ISSUE:        { bg: "bg-red-50   text-red-700",   label: "Issue"   },
  RECEIVE:      { bg: "bg-green-50 text-green-700", label: "Receive" },
  ADJUSTMENT:   { bg: "bg-blue-50  text-blue-700",  label: "Adjust"  },
  TRANSFER_IN:  { bg: "bg-teal-50  text-teal-700",  label: "Transfer in"  },
  TRANSFER_OUT: { bg: "bg-amber-50 text-amber-700", label: "Transfer out" },
}

export default function Transactions() {

  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState("")
  const [typeFilter,   setTypeFilter]   = useState("")
  const [issueModal,   setIssueModal]   = useState(null)
  const [receiveModal, setReceiveModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setTransactions(await fetchTransactions())
    } catch (err) {
      setError(err.message || "Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      t.items?.name?.toLowerCase().includes(q) ||
      t.items?.sku?.toLowerCase().includes(q) ||
      t.reference?.toLowerCase().includes(q)
    const matchType = !typeFilter || t.transaction_type === typeFilter
    return matchSearch && matchType
  })

  const totalIssued   = transactions.filter(t => t.transaction_type === "ISSUE").length
  const totalReceived = transactions.filter(t => t.transaction_type === "RECEIVE").length

  return (
    <div className="space-y-5">

      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Transactions</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {transactions.length} total · {totalReceived} received · {totalIssued} issued
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setReceiveModal({ itemId: null, itemName: null })}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                       bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ↓ Receive
          </button>
          <button
            onClick={() => setIssueModal({ itemId: null, itemName: null })}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                       bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            ↑ Issue
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4
                      flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by item, SKU, or reference..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-72
                     focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-600"
        >
          <option value="">All types</option>
          <option value="ISSUE">Issue</option>
          <option value="RECEIVE">Receive</option>
          <option value="ADJUSTMENT">Adjustment</option>
          <option value="TRANSFER_IN">Transfer in</option>
          <option value="TRANSFER_OUT">Transfer out</option>
        </select>
        {(search || typeFilter) && (
          <button
            onClick={() => { setSearch(""); setTypeFilter("") }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10
                        text-center text-sm text-gray-400">Loading transactions...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10
                        text-center text-sm text-gray-400">No transactions found.</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Item</th>
                  <th className="text-left px-4 py-3">SKU</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Quantity</th>
                  <th className="text-left px-4 py-3">Reference</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(t => {
                  const style = TYPE_STYLES[t.transaction_type] ?? TYPE_STYLES.ISSUE
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">

                      <td className="px-4 py-3 font-medium text-gray-800">
                        {t.items?.name ?? "—"}
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-gray-400">
                        {t.items?.sku ?? "—"}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg}`}>
                          {style.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {t.quantity} {t.items?.unit_of_measure}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        {t.reference || <span className="text-gray-300">—</span>}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(t.created_at).toLocaleString()}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setReceiveModal({
                              itemId:   t.items?.id ?? null,
                              itemName: t.items?.name ?? null
                            })}
                            className="text-xs px-2 py-1 border border-gray-200 rounded
                                       text-green-700 hover:bg-green-50 transition-colors"
                          >
                            Receive
                          </button>
                          <button
                            onClick={() => setIssueModal({
                              itemId:   t.items?.id ?? null,
                              itemName: t.items?.name ?? null
                            })}
                            className="text-xs px-2 py-1 border border-gray-200 rounded
                                       text-amber-700 hover:bg-amber-50 transition-colors"
                          >
                            Issue
                          </button>
                        </div>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {issueModal && (
        <IssueStockModal
          {...issueModal}
          onClose={() => setIssueModal(null)}
          onSuccess={load}
        />
      )}
      {receiveModal && (
        <ReceiveStockModal
          {...receiveModal}
          onClose={() => setReceiveModal(null)}
          onSuccess={load}
        />
      )}

    </div>
  )
}