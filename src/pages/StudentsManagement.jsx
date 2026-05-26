import { useEffect, useState } from "react"
import { fetchPendingStudents, fetchStudents, approveStudent, rejectStudent } from "../services/studentsApi"

function Badge({ text, color, bg }) {
  return (
    <span style={{
      background: bg, color, borderRadius: "6px",
      padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600,
    }}>
      {text}
    </span>
  )
}

function StudentRow({ student, onApprove, onReject, approving, rejecting }) {
  const [showReject, setShowReject] = useState(false)
  const [reason,     setReason]     = useState("")

  const sp = student.student_profiles?.[0] || {}
  const initials = (student.full_name || "?")
    .split(" ").slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("")

  return (
    <div style={{
      background: "#fff", borderRadius: "10px", padding: "1rem",
      border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* Avatar */}
        <div style={{
          width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: "0.9rem", fontWeight: 700,
        }}>
          {initials}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>
              {student.full_name}
            </p>
            {student.laboratories?.name && (
              <span style={{
                fontSize: "0.68rem", background: "#eff6ff", color: "#2563eb",
                borderRadius: "5px", padding: "1px 6px", fontWeight: 600,
              }}>
                {student.laboratories.name}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {sp.student_number && (
              <span style={{ fontSize: "0.72rem", background: "#f1f5f9", color: "#475569", borderRadius: "5px", padding: "2px 7px" }}>
                #{sp.student_number}
              </span>
            )}
            {sp.department && (
              <span style={{ fontSize: "0.72rem", background: "#f1f5f9", color: "#475569", borderRadius: "5px", padding: "2px 7px" }}>
                {sp.department}
              </span>
            )}
            {sp.course_name && (
              <span style={{ fontSize: "0.72rem", background: "#eff6ff", color: "#2563eb", borderRadius: "5px", padding: "2px 7px" }}>
                {sp.course_name}
              </span>
            )}
            {sp.course_level && (
              <span style={{ fontSize: "0.72rem", background: "#f0fdf4", color: "#16a34a", borderRadius: "5px", padding: "2px 7px" }}>
                {sp.course_level}
              </span>
            )}
            {sp.year_of_study && (
              <span style={{ fontSize: "0.72rem", background: "#f1f5f9", color: "#475569", borderRadius: "5px", padding: "2px 7px" }}>
                Year {sp.year_of_study}
              </span>
            )}
            {sp.supervisor_name && (
              <span style={{ fontSize: "0.72rem", background: "#fef3c7", color: "#92400e", borderRadius: "5px", padding: "2px 7px" }}>
                Sup: {sp.supervisor_name}
              </span>
            )}
          </div>
          <p style={{ margin: "6px 0 0", fontSize: "0.7rem", color: "#94a3b8" }}>
            Registered {new Date(student.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Actions */}
        {student.registration_status === "PENDING" && (
          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            <button
              onClick={() => onApprove(student.id)}
              disabled={approving}
              style={{
                background: "#16a34a", color: "#fff", border: "none",
                borderRadius: "7px", padding: "7px 14px", fontSize: "0.78rem",
                fontWeight: 600, cursor: approving ? "not-allowed" : "pointer",
                opacity: approving ? 0.6 : 1,
              }}
            >
              {approving ? "…" : "✓ Approve"}
            </button>
            <button
              onClick={() => setShowReject(r => !r)}
              disabled={rejecting}
              style={{
                background: "#fff", color: "#dc2626", border: "1px solid #fecaca",
                borderRadius: "7px", padding: "7px 12px", fontSize: "0.78rem",
                fontWeight: 600, cursor: "pointer",
              }}
            >
              Reject
            </button>
          </div>
        )}

        {student.registration_status === "ACTIVE" && (
          <Badge text="Active" color="#16a34a" bg="#dcfce7" />
        )}
        {student.registration_status === "REJECTED" && (
          <Badge text="Rejected" color="#dc2626" bg="#fee2e2" />
        )}
      </div>

      {/* Reject reason form */}
      {showReject && (
        <div style={{
          marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9",
          display: "grid", gap: "8px",
        }}>
          <textarea
            style={{
              width: "100%", border: "1px solid #e2e8f0", borderRadius: "8px",
              padding: "8px 12px", fontSize: "0.82rem", color: "#0f172a",
              outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: "60px",
            }}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Optional: reason for rejection (sent to student)"
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => { onReject(student.id, reason); setShowReject(false) }}
              disabled={rejecting}
              style={{
                background: "#dc2626", color: "#fff", border: "none",
                borderRadius: "7px", padding: "8px 16px", fontSize: "0.78rem",
                fontWeight: 600, cursor: rejecting ? "not-allowed" : "pointer",
              }}
            >
              {rejecting ? "…" : "Confirm Rejection"}
            </button>
            <button
              onClick={() => setShowReject(false)}
              style={{
                background: "#f1f5f9", color: "#374151", border: "1px solid #e2e8f0",
                borderRadius: "7px", padding: "8px 14px", fontSize: "0.78rem", cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentsManagement() {
  const [tab,        setTab]        = useState("pending")  // "pending" | "active"
  const [pending,    setPending]    = useState([])
  const [active,     setActive]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [actionId,   setActionId]   = useState(null)
  const [actionType, setActionType] = useState(null) // "approve" | "reject"

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, a] = await Promise.all([fetchPendingStudents(), fetchStudents()])
      setPending(Array.isArray(p) ? p : [])
      setActive(Array.isArray(a)  ? a : [])
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load students")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id) => {
    setActionId(id)
    setActionType("approve")
    try {
      await approveStudent(id)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to approve student")
    } finally {
      setActionId(null)
      setActionType(null)
    }
  }

  const handleReject = async (id, reason) => {
    setActionId(id)
    setActionType("reject")
    try {
      await rejectStudent(id, reason)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reject student")
    } finally {
      setActionId(null)
      setActionType(null)
    }
  }

  const tabBtn = (key, label, count) => (
    <button
      onClick={() => setTab(key)}
      style={{
        padding: "8px 18px", borderRadius: "8px", fontSize: "0.83rem", fontWeight: 600,
        cursor: "pointer", border: "none",
        background: tab === key ? "#0f172a" : "#f1f5f9",
        color:      tab === key ? "#fff"    : "#64748b",
        display: "flex", alignItems: "center", gap: "6px",
      }}
    >
      {label}
      {count > 0 && (
        <span style={{
          background: tab === key ? "rgba(255,255,255,0.2)" : "#e2e8f0",
          color:      tab === key ? "#fff" : "#374151",
          borderRadius: "10px", padding: "1px 7px", fontSize: "0.68rem",
        }}>
          {count}
        </span>
      )}
    </button>
  )

  const list = tab === "pending" ? pending : active

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "1.3rem", fontWeight: 700, color: "#0f172a" }}>
          Student Registrations
        </h1>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
          Review and manage student access to your laboratory.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
        {tabBtn("pending", "⏳ Pending Approval", pending.length)}
        {tabBtn("active",  "✅ Active Students",  active.length)}
      </div>

      {error && (
        <div style={{
          background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px",
          padding: "10px 14px", fontSize: "0.82rem", color: "#be123c", marginBottom: "1rem",
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8", fontSize: "0.85rem" }}>
          Loading…
        </div>
      ) : list.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: "12px", padding: "3rem",
          textAlign: "center", border: "1px solid #f1f5f9",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          <p style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
            {tab === "pending" ? "🎉" : "👤"}
          </p>
          <p style={{ margin: 0, fontWeight: 600, color: "#374151", fontSize: "0.9rem" }}>
            {tab === "pending"
              ? "No pending registrations"
              : "No active students"}
          </p>
          <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "0.8rem" }}>
            {tab === "pending"
              ? "All student registrations are up to date."
              : "Approved students will appear here."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {list.map(student => (
            <StudentRow
              key={student.id}
              student={student}
              onApprove={handleApprove}
              onReject={handleReject}
              approving={actionId === student.id && actionType === "approve"}
              rejecting={actionId === student.id && actionType === "reject"}
            />
          ))}
        </div>
      )}
    </div>
  )
}
