import { useContext } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import { supabase } from "../lib/supabase"

function PendingScreen({ registrationStatus }) {
  const isRejected = registrationStatus === "REJECTED"

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f1f5f9", padding: "1rem", fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "2.5rem", maxWidth: "440px",
        width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{isRejected ? "❌" : "⏳"}</div>
        <h2 style={{ margin: "0 0 8px", fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
          {isRejected ? "Registration Not Approved" : "Awaiting Lab Approval"}
        </h2>
        <p style={{ margin: "0 0 1.5rem", fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6 }}>
          {isRejected
            ? "Your registration request was not approved. Please contact your lab manager for more information."
            : "Your student registration has been received and is pending review by the laboratory manager. You will gain access once approved."}
        </p>
        {!isRejected && (
          <p style={{ margin: "0 0 1.5rem", fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.5 }}>
            This process typically takes 1–2 business days. Please check back later.
          </p>
        )}
        <button
          onClick={logout}
          style={{
            background: "#f1f5f9", color: "#374151", border: "1px solid #e2e8f0",
            borderRadius: "8px", padding: "10px 24px", fontSize: "0.85rem",
            fontWeight: 600, cursor: "pointer", width: "100%",
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children }) {
  const { session, loading, appUser, registrationStatus } = useContext(AuthContext)

  if (loading) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#f1f5f9", fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Loading…</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/" replace />

  // User has a session but is not yet active (pending/rejected student)
  if (appUser && appUser.is_active === false) {
    return <PendingScreen registrationStatus={registrationStatus} />
  }

  return children
}
