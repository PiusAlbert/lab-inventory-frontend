import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchNotifications } from "../services/notificationsApi"

const CATEGORIES = [
  {
    key:   "pending_students",
    label: "Students awaiting approval",
    to:    "/students",
    roles: ["LAB_MANAGER", "SUPER_ADMIN", "ADMIN"],
  },
  {
    key:   "pending_bookings",
    label: "Booking requests pending",
    to:    "/bookings",
    roles: ["LAB_MANAGER", "SUPER_ADMIN", "ADMIN"],
  },
  {
    key:   "pending_reports",
    label: "Reports awaiting assessment",
    to:    "/experiments",
    roles: ["LAB_MANAGER", "SUPER_ADMIN", "ADMIN", "TECHNICIAN"],
  },
  {
    key:   "low_stock",
    label: "Items low on stock",
    to:    "/items?filter=low-stock",
    roles: ["LAB_MANAGER", "SUPER_ADMIN", "ADMIN", "STORE_KEEPER"],
  },
  {
    key:   "expiring_soon",
    label: "Batches expiring within 7 days",
    to:    "/items?filter=expiring",
    roles: ["LAB_MANAGER", "SUPER_ADMIN", "ADMIN", "STORE_KEEPER"],
  },
]

function BellIcon() {
  return (
    <svg
      width="20" height="20"
      fill="none" stroke="currentColor" strokeWidth="1.8"
      viewBox="0 0 24 24" aria-hidden="true"
    >
      <path
        strokeLinecap="round" strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  )
}

export default function NotificationBell() {
  const { role } = useAuth()
  const navigate  = useNavigate()
  const ref       = useRef(null)

  const [counts, setCounts] = useState({})
  const [open,   setOpen]   = useState(false)

  const load = () => {
    fetchNotifications()
      .then(d => setCounts(d ?? {}))
      .catch(() => {})
  }

  // Initial load + poll every 60 s
  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const visible = CATEGORIES.filter(
    c => c.roles.includes(role) && (counts[c.key] ?? 0) > 0
  )
  const total = visible.reduce((sum, c) => sum + (counts[c.key] ?? 0), 0)

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        aria-label={`Notifications${total > 0 ? ` (${total} unread)` : ""}`}
        style={{
          position: "relative",
          background: open ? "#f1f5f9" : "none",
          border: "1px solid transparent",
          borderColor: open ? "#e2e8f0" : "transparent",
          cursor: "pointer",
          padding: "7px",
          borderRadius: "8px",
          color: total > 0 ? "#dc2626" : "#64748b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.12s",
          flexShrink: 0,
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0" } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent" } }}
      >
        <BellIcon />
        {total > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute", top: "3px", right: "3px",
              background: "#dc2626", color: "#fff",
              borderRadius: "999px",
              fontSize: total > 9 ? "0.55rem" : "0.6rem",
              fontWeight: 700,
              minWidth: "15px", height: "15px",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 3px", lineHeight: 1,
            }}
          >
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)",
            width: "290px",
            background: "#fff", borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            zIndex: 200, overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "11px 14px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>
              Notifications
            </p>
            {total > 0 && (
              <span style={{
                background: "#fee2e2", color: "#dc2626",
                borderRadius: "999px", padding: "2px 8px",
                fontSize: "0.68rem", fontWeight: 600,
              }}>
                {total} unread
              </span>
            )}
          </div>

          {/* Items */}
          {visible.length === 0 ? (
            <div style={{ padding: "1.5rem", textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: "1.3rem" }}>🔔</p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
                All clear — no pending items.
              </p>
            </div>
          ) : (
            visible.map((cat, i) => (
              <button
                key={cat.key}
                onClick={() => { navigate(cat.to); setOpen(false) }}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  gap: "12px", padding: "11px 14px",
                  background: "none", border: "none",
                  borderBottom: i < visible.length - 1 ? "1px solid #f8fafc" : "none",
                  cursor: "pointer", textAlign: "left", transition: "background 0.1s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc" }}
                onMouseLeave={e => { e.currentTarget.style.background = "none" }}
              >
                <span style={{
                  minWidth: "28px", height: "28px", borderRadius: "50%",
                  background: "#fee2e2", color: "#dc2626",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.72rem", fontWeight: 700, flexShrink: 0,
                }}>
                  {counts[cat.key]}
                </span>
                <span style={{ fontSize: "0.8rem", color: "#374151", lineHeight: 1.3 }}>
                  {cat.label}
                </span>
                <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#94a3b8", flexShrink: 0 }}>
                  →
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
