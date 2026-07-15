import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { fetchExperiments, deleteExperiment } from "../services/experimentsApi"
import { useAuth } from "../context/AuthContext"

const STATUS_STYLE = {
  DRAFT:       { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
  IN_PROGRESS: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  SUBMITTED:   { bg: "#fefce8", color: "#854d0e", border: "#fde68a" },
  APPROVED:    { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  REJECTED:    { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.DRAFT
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "999px",
      fontSize: "0.7rem",
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      letterSpacing: "0.3px",
    }}>
      {status.replace("_", " ")}
    </span>
  )
}

export default function Experiments() {
  const navigate = useNavigate()
  const { isAdmin, requiresLabSelection, role } = useAuth()
  const labRequired = isAdmin && requiresLabSelection

  const [experiments, setExperiments] = useState([])
  const [pagination,  setPagination]  = useState({ page: 1, pages: 1, total: 0 })
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const [statusFilter, setStatusFilter] = useState("")
  const [search,       setSearch]       = useState("")
  const [page,         setPage]         = useState(1)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  const isManager = ["TECHNICIAN", "LAB_MANAGER", "SUPER_ADMIN", "ADMIN"].includes(role)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit: 20 }
      if (statusFilter) params.status = statusFilter
      if (search.trim()) params.course = search.trim()
      const result = await fetchExperiments(params)
      setExperiments(result.data || [])
      setPagination(result.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load experiments")
      setExperiments([])
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => {
    load()
    window.addEventListener("labChanged", load)
    return () => window.removeEventListener("labChanged", load)
  }, [load])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteExperiment(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed")
    } finally {
      setDeleting(false)
    }
  }

  const cell = { padding: "14px 16px", fontSize: "0.82rem", color: "#374151", verticalAlign: "middle" }
  const th   = { padding: "11px 16px", fontSize: "0.72rem", fontWeight: 600, color: "#6b7280",
                 textTransform: "uppercase", letterSpacing: "0.5px", background: "#f9fafb",
                 borderBottom: "1px solid #e5e7eb", textAlign: "left" }

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#0f172a" }}>Experiments</h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
            {pagination.total} experiment{pagination.total !== 1 ? "s" : ""} recorded
          </p>
        </div>
        {!labRequired && (
          <button
            onClick={() => navigate("/experiments/new")}
            style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff",
              border: "none", borderRadius: "8px", padding: "9px 18px",
              fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", flexShrink: 0,
            }}
          >
            + New Experiment
          </button>
        )}
      </div>

      {labRequired && (
        <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: "8px",
          padding: "12px 16px", fontSize: "0.82rem", color: "#854d0e", marginBottom: "1rem" }}>
          Select a laboratory from the sidebar to view experiments.
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          placeholder="Search by course or module..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{
            flex: 1, minWidth: "200px", border: "1px solid #e2e8f0", borderRadius: "8px",
            padding: "8px 12px", fontSize: "0.82rem", outline: "none", color: "#0f172a",
          }}
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          style={{
            border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px 12px",
            fontSize: "0.82rem", color: "#374151", background: "#fff", cursor: "pointer",
          }}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px",
          padding: "12px 16px", fontSize: "0.82rem", color: "#be123c", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
            Loading experiments...
          </div>
        ) : experiments.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔬</div>
            <p style={{ margin: 0, fontWeight: 600, color: "#374151" }}>No experiments found</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
              {statusFilter || search ? "Try adjusting the filters" : "Create the first experiment for this laboratory"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Title</th>
                  <th style={th}>Course / Module</th>
                  <th style={th}>Date</th>
                  <th style={th}>Participants</th>
                  <th style={th}>Status</th>
                  <th style={{ ...th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp, i) => (
                  <tr
                    key={exp.id}
                    style={{
                      borderTop: i > 0 ? "1px solid #f1f5f9" : "none",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    onClick={() => navigate(`/experiments/${exp.id}`)}
                  >
                    <td style={cell}>
                      <span style={{ fontWeight: 600, color: "#0f172a" }}>{exp.title}</span>
                    </td>
                    <td style={cell}>{exp.course_module || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                    <td style={cell}>
                      {exp.session_date ? new Date(exp.session_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={cell}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: "24px", height: "24px", borderRadius: "50%",
                        background: "#eff6ff", color: "#1d4ed8",
                        fontSize: "0.72rem", fontWeight: 700,
                      }}>
                        {exp.experiment_participants?.length ?? 0}
                      </span>
                    </td>
                    <td style={cell}><StatusBadge status={exp.status} /></td>
                    <td style={{ ...cell, textAlign: "right" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        {["DRAFT", "IN_PROGRESS", "REJECTED"].includes(exp.status) && !labRequired && (
                          <button
                            onClick={() => navigate(`/experiments/${exp.id}/edit`)}
                            style={{
                              background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8",
                              borderRadius: "6px", padding: "5px 10px", fontSize: "0.75rem",
                              fontWeight: 500, cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {isManager && ["SUBMITTED"].includes(exp.status) && (
                          <button
                            onClick={() => navigate(`/experiments/${exp.id}/review`)}
                            style={{
                              background: "#fefce8", border: "1px solid #fde68a", color: "#854d0e",
                              borderRadius: "6px", padding: "5px 10px", fontSize: "0.75rem",
                              fontWeight: 500, cursor: "pointer",
                            }}
                          >
                            Review
                          </button>
                        )}
                        {["DRAFT", "REJECTED"].includes(exp.status) && !labRequired && (
                          <button
                            onClick={() => setDeleteTarget(exp)}
                            style={{
                              background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c",
                              borderRadius: "6px", padding: "5px 10px", fontSize: "0.75rem",
                              fontWeight: 500, cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
            Page {pagination.page} of {pagination.pages} · {pagination.total} total
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{
                border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 12px",
                fontSize: "0.78rem", background: page <= 1 ? "#f9fafb" : "#fff",
                color: page <= 1 ? "#94a3b8" : "#374151", cursor: page <= 1 ? "default" : "pointer",
              }}
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage(p => p + 1)}
              style={{
                border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 12px",
                fontSize: "0.78rem", background: page >= pagination.pages ? "#f9fafb" : "#fff",
                color: page >= pagination.pages ? "#94a3b8" : "#374151",
                cursor: page >= pagination.pages ? "default" : "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div style={{
            background: "#fff", borderRadius: "12px", padding: "1.5rem",
            maxWidth: "400px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
              Delete experiment?
            </h3>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "#64748b" }}>
              <strong>{deleteTarget.title}</strong> will be permanently deleted. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px 16px",
                  fontSize: "0.82rem", background: "#fff", color: "#374151", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  border: "none", borderRadius: "8px", padding: "8px 16px",
                  fontSize: "0.82rem", background: "#dc2626", color: "#fff",
                  cursor: deleting ? "default" : "pointer", fontWeight: 600,
                }}
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
