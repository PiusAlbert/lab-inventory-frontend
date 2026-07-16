import { useEffect, useState, useCallback } from "react"
import { fetchAuditLogs } from "../services/auditApi"
import { useAuth } from "../context/AuthContext"
import Pagination from "../components/Pagination"
import { exportCSV } from "../utils/csvExport"

const ACTION_META = {
  CREATE:      { label: "Created",     cls: "bg-green-50  text-green-700"  },
  UPDATE:      { label: "Updated",     cls: "bg-blue-50   text-blue-700"   },
  DELETE:      { label: "Deleted",     cls: "bg-red-50    text-red-700"    },
  ISSUE:       { label: "Issued",      cls: "bg-amber-50  text-amber-700"  },
  RECEIVE:     { label: "Received",    cls: "bg-teal-50   text-teal-700"   },
  ADJUSTMENT:  { label: "Adjusted",    cls: "bg-purple-50 text-purple-700" },
  BULK_IMPORT: { label: "Bulk Import", cls: "bg-indigo-50 text-indigo-700" },
}

const ENTITY_LABELS = {
  items:               "Items",
  stock_batches:       "Stock Batches",
  stock_transactions:  "Transactions",
  categories:          "Categories",
  app_users:           "Users",
  laboratories:        "Laboratories",
  experiments:         "Experiments",
  experiment_bookings: "Bookings",
}

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days > 7)  return new Date(dateStr).toLocaleDateString()
  if (days > 0)  return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0)  return `${mins}m ago`
  return "just now"
}

export default function AuditLog() {
  const { role } = useAuth()
  const canView = ["LAB_MANAGER", "SUPER_ADMIN", "ADMIN"].includes(role)

  const [logs,       setLogs]       = useState([])
  const [pagination, setPagination] = useState(null)
  const [page,       setPage]       = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [action,     setAction]     = useState("")
  const [entity,     setEntity]     = useState("")
  const [expanded,   setExpanded]   = useState({})

  const load = useCallback(async (p = 1, act = action, ent = entity) => {
    setLoading(true); setError(null)
    try {
      const res = await fetchAuditLogs({ page: p, limit: 50, action: act, entity: ent })
      setLogs(res.data || [])
      setPagination(res.pagination || null)
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load audit log")
    } finally {
      setLoading(false)
    }
  }, [action, entity])

  useEffect(() => {
    load(page)
  }, [load, page])

  const handleActionChange = (val) => {
    setAction(val)
    setPage(1)
    load(1, val, entity)
  }

  const handleEntityChange = (val) => {
    setEntity(val)
    setPage(1)
    load(1, action, val)
  }

  const handleClear = () => {
    setAction(""); setEntity(""); setPage(1)
    load(1, "", "")
  }

  const handleExport = () => {
    exportCSV("audit-log.csv", [
      { label: "Date",       value: l => new Date(l.created_at).toLocaleString() },
      { label: "Action",     value: l => l.action },
      { label: "Entity",     value: l => ENTITY_LABELS[l.table_affected] || l.table_affected },
      { label: "Record ID",  value: l => l.record_id },
      { label: "Performed By", value: l => l.performer?.full_name || l.user_id },
      { label: "Role",       value: l => l.performer?.role },
    ], logs)
  }

  if (!canView) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-6">
        <p className="font-medium text-sm">Access restricted</p>
        <p className="text-sm mt-1">
          Only Lab Managers and Super Admins can view the audit log.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Audit Log</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {pagination
              ? `${pagination.total.toLocaleString()} total entries recorded`
              : "Record of all create, update, and delete actions"}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={logs.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border
                     border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4
                      flex flex-wrap gap-3 items-center">
        <select
          value={action}
          onChange={e => handleActionChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600
                     focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_META).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={entity}
          onChange={e => handleEntityChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600
                     focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">All entities</option>
          {Object.entries(ENTITY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        {(action || entity) && (
          <button
            onClick={handleClear}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10
                        text-center text-sm text-gray-400">
          Loading audit log...
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">{error}</div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10
                        text-center text-sm text-gray-400">
          No audit entries found.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">When</th>
                  <th className="text-left px-4 py-3">Action</th>
                  <th className="text-left px-4 py-3">Entity</th>
                  <th className="text-left px-4 py-3">Performed by</th>
                  <th className="text-left px-4 py-3">Record</th>
                  <th className="text-left px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => {
                  const meta   = ACTION_META[log.action] || { label: log.action, cls: "bg-gray-50 text-gray-600" }
                  const entity = ENTITY_LABELS[log.table_affected] || log.table_affected || "—"
                  const hasDetails = log.details && Object.keys(log.details).length > 0

                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">

                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs font-medium text-gray-700">{timeAgo(log.created_at)}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-600">{entity}</td>

                      <td className="px-4 py-3">
                        {log.performer ? (
                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              {log.performer.full_name}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {log.performer.role?.replace(/_/g, " ")}
                            </p>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-gray-400">
                            {log.user_id ? `${log.user_id.slice(0, 8)}…` : "—"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-gray-400">
                        {log.record_id ? `${log.record_id.slice(0, 8)}…` : "—"}
                      </td>

                      <td className="px-4 py-3">
                        {hasDetails && (
                          <>
                            <button
                              onClick={() =>
                                setExpanded(prev => ({ ...prev, [log.id]: !prev[log.id] }))
                              }
                              className="text-xs text-blue-500 hover:text-blue-700 underline"
                            >
                              {expanded[log.id] ? "Hide" : "View"}
                            </button>
                            {expanded[log.id] && (
                              <pre className="mt-2 text-[11px] text-gray-500 bg-gray-50 rounded
                                             p-2 max-w-xs overflow-x-auto leading-relaxed">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            )}
                          </>
                        )}
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
