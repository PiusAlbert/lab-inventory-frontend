import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

import logoImg from "../assets/logo.jpg"
import labBg   from "../assets/lab-bw-glass.jpg"   // subtle monochrome glassware — sidebar accent

const NAV = [
  { to: "/dashboard",    label: "Dashboard",     icon: "⬛" },
  { to: "/categories",   label: "Categories",    icon: "🏷" },
  { to: "/items",        label: "Items",         icon: "📦" },
  { to: "/batches",      label: "Stock Batches", icon: "🗂" },
  { to: "/transactions", label: "Transactions",  icon: "↕" },
]

export default function Layout({ children }) {
  const location = useLocation()
  const { isAdmin, selectedLabId, setSelectedLabId } = useAuth()

  const [labs,        setLabs]        = useState([])
  const [labsLoading, setLabsLoading] = useState(false)

  useEffect(() => {
    if (!isAdmin) return
    setLabsLoading(true)
    api.get("/laboratories")
      .then(r => setLabs(Array.isArray(r.data) ? r.data : []))
      .catch(console.error)
      .finally(() => setLabsLoading(false))
  }, [isAdmin])

  const handleLabChange = (e) => {
    const val = e.target.value || null
    setSelectedLabId(val)
    if (val) sessionStorage.setItem("x-lab-id", val)
    else sessionStorage.removeItem("x-lab-id")
    window.dispatchEvent(new CustomEvent("labChanged", { detail: { labId: val } }))
  }

  const logout = async () => {
    sessionStorage.removeItem("x-lab-id")
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(to + "/")

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f1f5f9" }}>

      {/* ── SIDEBAR ──────────────────────────────── */}
      <aside style={{
        width: "230px",
        flexShrink: 0,
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Subtle lab image tint at bottom of sidebar */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "220px",
          backgroundImage: `url(${labBg})`,
          backgroundSize: "cover", backgroundPosition: "center top",
          opacity: 0.08,
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
        }} />

        {/* Logo + title */}
        <div style={{
          padding: "1.5rem 1.25rem 1.25rem",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: "12px",
          position: "relative",
        }}>
          <img
            src={logoImg}
            alt="DIST"
            style={{
              width: "40px", height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid rgba(96,165,250,0.4)",
              flexShrink: 0,
            }}
          />
          <div>
            <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "#f1f5f9", lineHeight: 1.2 }}>
              Lab Inventory
            </p>
            <p style={{ margin: 0, fontSize: "0.65rem", color: "#64748b", lineHeight: 1.2, marginTop: "2px" }}>
              DECOHAS Labs
            </p>
          </div>
        </div>

        {isAdmin && (
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
            <span style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: "#fff",
              fontSize: "0.65rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "10px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}>
              Super Admin
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "1rem 0.75rem", position: "relative" }}>
          {NAV.map(({ to, label, icon }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  marginBottom: "2px",
                  textDecoration: "none",
                  fontSize: "0.82rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#ffffff" : "#94a3b8",
                  background: active
                    ? "linear-gradient(135deg, #1d4ed8, #1e40af)"
                    : "transparent",
                  boxShadow: active ? "0 2px 8px rgba(29,78,216,0.35)" : "none",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)" }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}
              >
                <span style={{ fontSize: "0.9rem", opacity: active ? 1 : 0.6 }}>{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid rgba(255,255,255,0.07)", position: "relative" }}>
          <button
            onClick={logout}
            style={{
              width: "100%",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#f87171",
              borderRadius: "8px",
              padding: "8px",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.2)"
              e.currentTarget.style.color = "#fca5a5"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.1)"
              e.currentTarget.style.color = "#f87171"
            }}
          >
            <img src={logoImg} alt="" style={{ width: "18px", height: "18px", borderRadius: "50%", objectFit: "cover", opacity: 0.7 }} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* TOPBAR */}
        <header style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 1.5rem",
          height: "56px",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>
              DECOHAS
            </span>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b", textTransform: "capitalize" }}>
              {location.pathname.split("/")[1] || "dashboard"}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Lab switcher — admin only */}
          {isAdmin && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                Viewing:
              </span>
              <select
                value={selectedLabId || ""}
                onChange={handleLabChange}
                disabled={labsLoading}
                style={{
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "5px 10px",
                  fontSize: "0.78rem",
                  color: "#374151",
                  background: "#f8fafc",
                  outline: "none",
                  minWidth: "170px",
                  cursor: "pointer",
                }}
              >
                <option value="">All laboratories</option>
                {labs.map(lab => (
                  <option key={lab.id} value={lab.id}>{lab.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Live status dot */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 0 2px rgba(34,197,94,0.2)",
            }} />
            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Live</span>
          </div>

        </header>

        {/* PAGE CONTENT */}
        <main style={{ flex: 1, padding: "1.75rem", overflowY: "auto" }}>
          {children}
        </main>

      </div>
    </div>
  )
}