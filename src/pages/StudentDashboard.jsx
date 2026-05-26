import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchExperiments } from "../services/experimentsApi"

const STATUS_META = {
  DRAFT:       { label: "Draft",        bg: "#f1f5f9", color: "#64748b", icon: "📝" },
  IN_PROGRESS: { label: "In Progress",  bg: "#eff6ff", color: "#2563eb", icon: "🔬" },
  SUBMITTED:   { label: "Under Review", bg: "#fef3c7", color: "#d97706", icon: "⏳" },
  APPROVED:    { label: "Approved",     bg: "#dcfce7", color: "#16a34a", icon: "✅" },
  REJECTED:    { label: "Needs Revision",bg:"#fee2e2", color: "#dc2626", icon: "⚠️" },
}

function StatCard({ label, value, color, bg, icon }) {
  return (
    <div style={{
      background: bg, borderRadius: "12px", padding: "1rem 1.25rem",
      border: `1px solid ${color}22`, display: "flex", alignItems: "center", gap: "12px",
    }}>
      <div style={{
        width: "40px", height: "40px", borderRadius: "10px",
        background: `${color}18`, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "1.1rem", flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
        <p style={{ margin: "3px 0 0", fontSize: "0.72rem", color: "#64748b", fontWeight: 500 }}>{label}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.DRAFT
  return (
    <span style={{
      background: m.bg, color: m.color, borderRadius: "6px",
      padding: "2px 8px", fontSize: "0.71rem", fontWeight: 600,
    }}>
      {m.icon} {m.label}
    </span>
  )
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { fullName } = useAuth()

  const [experiments, setExperiments] = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    fetchExperiments({ limit: 50 })
      .then(d => setExperiments(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []))
      .catch(() => setExperiments([]))
      .finally(() => setLoading(false))
  }, [])

  const counts = experiments.reduce((acc, exp) => {
    acc[exp.status] = (acc[exp.status] || 0) + 1
    return acc
  }, {})

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  })()

  const firstName = fullName?.split(" ")[0] || "Student"

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Welcome */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "1.35rem", fontWeight: 700, color: "#0f172a" }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
          Here's an overview of your experiment activity.
        </p>
      </div>

      {/* Quick actions */}
      <div style={{
        display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "1.75rem",
      }}>
        <button
          onClick={() => navigate("/experiments/wizard")}
          style={{
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff",
            border: "none", borderRadius: "10px", padding: "10px 20px",
            fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
            boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
          }}
        >
          🔬 New Experiment
        </button>
        <Link to="/items" style={{
          background: "#fff", color: "#374151", border: "1px solid #e2e8f0",
          borderRadius: "10px", padding: "10px 20px", fontSize: "0.85rem",
          fontWeight: 500, cursor: "pointer", textDecoration: "none",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          📦 Browse Items
        </Link>
        <Link to="/experiments" style={{
          background: "#fff", color: "#374151", border: "1px solid #e2e8f0",
          borderRadius: "10px", padding: "10px 20px", fontSize: "0.85rem",
          fontWeight: 500, cursor: "pointer", textDecoration: "none",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          📄 All Experiments
        </Link>
      </div>

      {/* Stats grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "10px",
        marginBottom: "1.75rem",
      }}>
        <StatCard
          label="Total Experiments" value={experiments.length}
          color="#0f172a" bg="#f8fafc" icon="🧪"
        />
        <StatCard
          label="Under Review" value={counts.SUBMITTED || 0}
          color="#d97706" bg="#fffbeb" icon="⏳"
        />
        <StatCard
          label="Approved" value={counts.APPROVED || 0}
          color="#16a34a" bg="#f0fdf4" icon="✅"
        />
        <StatCard
          label="Needs Revision" value={counts.REJECTED || 0}
          color="#dc2626" bg="#fff5f5" icon="⚠️"
        />
      </div>

      {/* Recent experiments */}
      <div style={{
        background: "#fff", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: "1px solid #f1f5f9", overflow: "hidden",
      }}>
        <div style={{
          padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
            Recent Experiments
          </h2>
          <Link to="/experiments" style={{ fontSize: "0.78rem", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
            View all →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
            Loading…
          </div>
        ) : experiments.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>🔬</p>
            <p style={{ margin: "0 0 8px", fontWeight: 600, color: "#374151", fontSize: "0.9rem" }}>
              No experiments yet
            </p>
            <p style={{ margin: "0 0 1.25rem", color: "#94a3b8", fontSize: "0.82rem" }}>
              Submit your first experiment request to get started.
            </p>
            <button
              onClick={() => navigate("/experiments/wizard")}
              style={{
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff",
                border: "none", borderRadius: "8px", padding: "10px 20px",
                fontSize: "0.83rem", fontWeight: 600, cursor: "pointer",
              }}
            >
              Start Experiment Wizard
            </button>
          </div>
        ) : (
          <div>
            {experiments.slice(0, 8).map((exp, i) => (
              <Link
                key={exp.id}
                to={`/experiments/${exp.id}`}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 1.25rem", textDecoration: "none",
                  borderBottom: i < Math.min(experiments.length, 8) - 1 ? "1px solid #f8fafc" : "none",
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{
                  width: "36px", height: "36px", borderRadius: "8px",
                  background: "#f1f5f9", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "1rem", flexShrink: 0,
                }}>
                  {STATUS_META[exp.status]?.icon || "🧪"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "#0f172a",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {exp.title}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#94a3b8" }}>
                    {exp.session_date ? new Date(exp.session_date).toLocaleDateString() : "No date"}
                    {exp.course_module ? ` · ${exp.course_module}` : ""}
                  </p>
                </div>
                <StatusBadge status={exp.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Tip card for rejected experiments */}
      {(counts.REJECTED || 0) > 0 && (
        <div style={{
          marginTop: "1rem", background: "#fff7ed", border: "1px solid #fed7aa",
          borderRadius: "10px", padding: "12px 16px", fontSize: "0.82rem", color: "#92400e",
        }}>
          ⚠️ You have {counts.REJECTED} experiment{counts.REJECTED > 1 ? "s" : ""} that need revision.{" "}
          <Link to="/experiments?status=REJECTED" style={{ color: "#dc2626", fontWeight: 600 }}>
            Review feedback →
          </Link>
        </div>
      )}
    </div>
  )
}
