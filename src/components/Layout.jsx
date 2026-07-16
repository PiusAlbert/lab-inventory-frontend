import { useEffect, useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import api from "../lib/api"
import NotificationBell from "./NotificationBell"

import logoImg from "../assets/logo.jpg"
import labBg   from "../assets/lab-bw-glass.jpg"

// Navigation items — full (non-student roles)
const NAV_FULL = [
  { to: "/dashboard",    label: "Dashboard",     icon: "⬛" },
  { to: "/categories",   label: "Categories",    icon: "🏷"  },
  { to: "/items",        label: "Items",         icon: "📦" },
  { to: "/batches",      label: "Stock Batches", icon: "🗂"  },
  { to: "/transactions", label: "Transactions",  icon: "↕"  },
  { to: "/reports",      label: "Reports",       icon: "📊" },
  { to: "/experiments",  label: "Experiments",   icon: "🔬" },
  { to: "/bookings",     label: "Bookings",      icon: "📅"  },
  { to: "/users",        label: "Users",         icon: "👥",  managerOnly: true },
  { to: "/students",     label: "Students",      icon: "👩‍🎓", managerOnly: true },
  { to: "/laboratories", label: "Laboratories",  icon: "🏛",  adminOnly: true  },
  { to: "/profile",      label: "My Profile",    icon: "⚙️"  },
]

// Navigation items — students only
const NAV_STUDENT = [
  { to: "/student-dashboard",  label: "My Dashboard",  icon: "🏠" },
  { to: "/bookings",           label: "My Bookings",   icon: "📅" },
  { to: "/items",              label: "Browse Items",   icon: "📦" },
  { to: "/experiments",        label: "My Experiments", icon: "🔬" },
  { to: "/experiments/wizard", label: "Submit Report", icon: "➕" },
  { to: "/profile",            label: "My Profile",   icon: "⚙️" },
]

const MANAGER_ROLES = ["LAB_MANAGER", "SUPER_ADMIN", "ADMIN"]

function toTitleCaseRoute(route) {
  if (!route) return "Dashboard"
  return route
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

// ─── Mobile detection hook ─────────────────────────────────────────────────
// Uses matchMedia so it fires exactly when the CSS breakpoint crosses 768px.
// Falls back gracefully if window is undefined (SSR safety).
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e) => setIsMobile(e.matches)
    // addEventListener is standard; addListener is the Safari legacy fallback
    if (mq.addEventListener) {
      mq.addEventListener("change", handler)
      return () => mq.removeEventListener("change", handler)
    } else {
      mq.addListener(handler)
      return () => mq.removeListener(handler)
    }
  }, [])
  return isMobile
}

// ─── Hamburger icon (no SVG dependency) ────────────────────────────────────
function HamburgerIcon() {
  const bar = {
    display: "block",
    width: "20px",
    height: "2px",
    background: "currentColor",
    borderRadius: "1px",
  }
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <span style={bar} />
      <span style={bar} />
      <span style={bar} />
    </span>
  )
}

// ─── Shared sidebar content ────────────────────────────────────────────────
// Rendered inside the desktop <aside> AND the mobile drawer.
// onNavClick closes the drawer when a link is tapped on mobile.
function SidebarContent({
  fullName,
  initials,
  roleLabel,
  isAdmin,
  selectedLabId,
  labs,
  labsLoading,
  handleLabChange,
  logout,
  isActive,
  onNavClick,
  navItems,
}) {
  return (
    <>
      {/* Decorative bg image — purely visual */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "220px",
          backgroundImage: `url(${labBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          opacity: 0.08,
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
          pointerEvents: "none",
        }}
      />

      {/* Brand header */}
      <div
        style={{
          padding: "1.5rem 1.25rem 1.25rem",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          position: "relative",
          flexShrink: 0,
        }}
      >
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
            DIST Labs
          </p>
        </div>
      </div>

      {/* User profile */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px", height: "38px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.84rem", fontWeight: 700,
              flexShrink: 0,
              boxShadow: "0 0 0 3px rgba(37,99,235,0.18)",
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#f8fafc",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}
            >
              {fullName}
            </p>
            <p
              style={{
                margin: "2px 0 0", fontSize: "0.68rem", color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: "0.5px",
              }}
            >
              {roleLabel}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div style={{ marginTop: "10px" }}>
            <span
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#fff",
                fontSize: "0.65rem", fontWeight: 600,
                padding: "2px 8px", borderRadius: "10px",
                letterSpacing: "0.5px", textTransform: "uppercase",
              }}
            >
              Super Admin
            </span>
          </div>
        )}
      </div>

      {/* Admin lab selector — in sidebar on ALL viewports */}
      {isAdmin && (
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <p
            style={{
              margin: "0 0 5px",
              fontSize: "0.63rem",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Active Laboratory
          </p>
          <select
            value={selectedLabId || ""}
            onChange={handleLabChange}
            disabled={labsLoading}
            style={{
              width: "100%",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "6px",
              padding: "7px 10px",
              fontSize: "0.78rem",
              color: "#e2e8f0",
              background: "rgba(255,255,255,0.07)",
              outline: "none",
              cursor: "pointer",
              minHeight: "38px",
            }}
          >
            <option value=""       style={{ background: "#1e293b", color: "#e2e8f0" }}>All laboratories</option>
            {labs.map((lab) => (
              <option key={lab.id} value={lab.id} style={{ background: "#1e293b", color: "#e2e8f0" }}>
                {lab.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation links */}
      <nav style={{ flex: 1, padding: "1rem 0.75rem", position: "relative", overflowY: "auto" }}>
        {navItems.map(({ to, label, icon }) => {
          const active = isActive(to)
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "11px 12px",   // 44px touch target via line-height
                borderRadius: "8px",
                marginBottom: "2px",
                textDecoration: "none",
                fontSize: "0.82rem",
                fontWeight: active ? 600 : 400,
                color: active ? "#ffffff" : "#94a3b8",
                background: active
                  ? "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(29,78,216,0.95))"
                  : "transparent",
                boxShadow: active ? "0 6px 18px rgba(37,99,235,0.22)" : "none",
                transition: "all 0.15s ease",
                position: "relative",
                minHeight: "44px",
              }}
            >
              <span style={{ width: "16px", textAlign: "center" }}>{icon}</span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div
        style={{
          padding: "1rem 0.75rem",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <button
          onClick={logout}
          style={{
            width: "100%",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
            borderRadius: "8px",
            padding: "10px",
            fontSize: "0.8rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            minHeight: "44px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.2)"
            e.currentTarget.style.color = "#fca5a5"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.1)"
            e.currentTarget.style.color = "#f87171"
          }}
        >
          <img
            src={logoImg}
            alt=""
            style={{ width: "18px", height: "18px", borderRadius: "50%", objectFit: "cover", opacity: 0.7 }}
          />
          Sign out
        </button>
      </div>
    </>
  )
}

// ─── Main Layout component ─────────────────────────────────────────────────
export default function Layout({ children }) {
  const location = useLocation()
  const { session, appUser, role, isAdmin, selectedLabId, setSelectedLabId } = useAuth()
  const isMobile = useIsMobile()

  // Build nav items based on role
  const navItems = useMemo(() => {
    if (role === "STUDENT") return NAV_STUDENT
    return NAV_FULL.filter(item => {
      if (item.adminOnly)   return role === "SUPER_ADMIN"
      if (item.managerOnly) return MANAGER_ROLES.includes(role)
      return true
    })
  }, [role])

  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [labs,        setLabs]        = useState([])
  const [labsLoading, setLabsLoading] = useState(false)

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (isMobile && drawerOpen) {
      document.body.style.overflow   = "hidden"
      document.body.style.touchAction = "none"
    } else {
      document.body.style.overflow   = ""
      document.body.style.touchAction = ""
    }
    return () => {
      document.body.style.overflow   = ""
      document.body.style.touchAction = ""
    }
  }, [isMobile, drawerOpen])

  // Fetch labs for admin
  useEffect(() => {
    if (!isAdmin) return
    setLabsLoading(true)
    api.get("/laboratories")
      .then((r) => setLabs(Array.isArray(r.data) ? r.data : []))
      .catch(console.error)
      .finally(() => setLabsLoading(false))
  }, [isAdmin])

  const handleLabChange = (e) => {
    const val = e.target.value || null
    setSelectedLabId(val)
    if (val) sessionStorage.setItem("x-lab-id", val)
    else      sessionStorage.removeItem("x-lab-id")
    window.dispatchEvent(new CustomEvent("labChanged", { detail: { labId: val } }))
  }

  const logout = async () => {
    sessionStorage.removeItem("x-lab-id")
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(to + "/")

  const fullName = useMemo(() =>
    appUser?.full_name?.trim() || session?.user?.email || "User",
    [appUser, session]
  )

  const initials = useMemo(() => {
    const parts = fullName.split(" ").filter(Boolean)
    if (parts.length === 0) return "U"
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("")
  }, [fullName])

  const roleLabel = useMemo(() =>
    role ? role.replaceAll("_", " ") : "User",
    [role]
  )

  const currentLabName = useMemo(() => {
    if (!isAdmin) return appUser?.laboratory_id ? "Assigned laboratory" : "No laboratory"
    if (!selectedLabId) return "All laboratories"
    return labs.find((lab) => lab.id === selectedLabId)?.name || "Selected laboratory"
  }, [isAdmin, appUser, selectedLabId, labs])

  const currentSection = toTitleCaseRoute(
    location.pathname.split("/")[1] || "dashboard"
  )

  const sidebarProps = {
    fullName, initials, roleLabel, isAdmin,
    selectedLabId, labs, labsLoading,
    handleLabChange, logout, isActive,
    navItems,
    onNavClick: () => setDrawerOpen(false),
  }

 
  if (isMobile) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100dvh",   // dvh avoids iOS Safari address-bar overlap
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          background: "#f1f5f9",
        }}
      >
        {/* ─ Mobile top app bar ─ */}
        <header
          style={{
            background: "#0f172a",
            height: "56px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            position: "sticky",
            top: 0,
            zIndex: 50,
            flexShrink: 0,
            // Respect device safe areas (notch / Dynamic Island)
            paddingLeft:  "max(12px, env(safe-area-inset-left))",
            paddingRight: "max(12px, env(safe-area-inset-right))",
          }}
        >
          {/* Hamburger — full 44x44 touch target */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="mobile-nav-drawer"
            style={{
              background: "none",
              border: "none",
              color: "#f1f5f9",
              cursor: "pointer",
              padding: 0,
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              flexShrink: 0,
            }}
          >
            <HamburgerIcon />
          </button>

          {/* Section + lab name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.84rem",
                fontWeight: 600,
                color: "#f1f5f9",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.25,
              }}
            >
              {currentSection}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "0.63rem",
                color: "#64748b",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.25,
              }}
            >
              {currentLabName}
            </p>
          </div>

          {/* Notification bell */}
          <div style={{ color: "#f1f5f9" }}>
            <NotificationBell />
          </div>

          {/* User initials */}
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.72rem",
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: "0 0 0 2px rgba(37,99,235,0.25)",
            }}
          >
            {initials}
          </div>
        </header>

        {/* ─ Backdrop ─ */}
        <div
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 99,
            opacity: drawerOpen ? 1 : 0,
            pointerEvents: drawerOpen ? "auto" : "none",
            transition: "opacity 0.25s ease",
            touchAction: "none",
          }}
        />

        {/* ─ Slide-in drawer ─ */}
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            // Clamp width: 280px but never exceed 85% of viewport
            width: "min(280px, 85vw)",
            height: "100dvh",
            background: "#0f172a",
            display: "flex",
            flexDirection: "column",
            zIndex: 100,
            transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.26s cubic-bezier(0.4, 0, 0.2, 1)",
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehavior: "contain",
            paddingLeft: "env(safe-area-inset-left)",
          }}
        >
          {/* Close button */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "10px 12px 0",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation menu"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
              }}
            >
              ✕
            </button>
          </div>

          <SidebarContent {...sidebarProps} />
        </div>

        {/* ─ Page content ─ */}
        <main
          style={{
            flex: 1,
            padding: "1rem",
            minWidth: 0,
            width: "100%",
            // Prevent child overflow from creating page-level horizontal scroll
            overflowX: "hidden",
            // Respect iOS home indicator
            paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
        >
          {children}
        </main>
      </div>
    )
  }

  return (
    // height (not minHeight) constrains the layout to exactly the viewport.
    // The main content scrolls inside <main> — the sidebar and header never leave the screen.
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        background: "#f1f5f9",
      }}
    >
      {/* Desktop sidebar — full viewport height, sign-out always pinned at bottom */}
      <aside
        style={{
          width: "250px",
          flexShrink: 0,
          background: "#0f172a",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Content column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Desktop header — sticky within the content column, always visible */}
        <header
          style={{
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            padding: "0 1.5rem",
            height: "64px",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                DECOHAS
              </span>
              <span style={{ color: "#cbd5e1" }}>/</span>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  textTransform: "capitalize",
                }}
              >
                {currentSection}
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
              Signed in as <strong style={{ color: "#334155" }}>{fullName}</strong>
              {" · "}
              <span style={{ textTransform: "capitalize" }}>{roleLabel.toLowerCase()}</span>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Notification bell */}
          <NotificationBell />

          {/* Lab status pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "999px",
              padding: "6px 10px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 0 2px rgba(34,197,94,0.18)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Live</span>
              <span style={{ fontSize: "0.72rem", color: "#0f172a", fontWeight: 600 }}>
                {currentLabName}
              </span>
            </div>
          </div>

          {/* Sign-out button — always visible in the header regardless of scroll position */}
          <button
            onClick={logout}
            title="Sign out"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid #fee2e2",
              background: "#fff5f5",
              color: "#dc2626",
              fontSize: "0.78rem",
              fontWeight: 500,
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fee2e2"
              e.currentTarget.style.borderColor = "#fca5a5"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff5f5"
              e.currentTarget.style.borderColor = "#fee2e2"
            }}
          >
            <span style={{ fontSize: "0.9rem" }}>⏻</span>
            Sign out
          </button>
        </header>

        {/* Scrollable content area — only this scrolls, not the whole page */}
        <main style={{ flex: 1, padding: "1.75rem", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  )
}