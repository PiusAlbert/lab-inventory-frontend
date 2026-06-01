import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "../lib/supabase"

async function getRoleForUser(userId) {
  try {
    const { data } = await supabase
      .from("app_users")
      .select("role")
      .eq("id", userId)
      .maybeSingle()
    return data?.role ?? null
  } catch {
    return null
  }
}

import logoImg from "../assets/logo.jpg"
import bg1 from "../assets/lab-beaker.jpg"
import bg2 from "../assets/lab-bw-glass.jpg"
import bg3 from "../assets/lab-colorful.jpg"
import bg4 from "../assets/lab-glassware.jpg"
import bg5 from "../assets/lab-microscope.jpg"
import bg6 from "../assets/lab-researcher.jpg"

const SLIDES = [bg1, bg3, bg5, bg6, bg4, bg2]

const SLIDE_CAPTIONS = [
  "Precision measurement in action",
  "Multi-disciplinary chemical research",
  "Advanced scientific equipment tracking",
  "Molecular analysis and research",
  "Glassware and reagent management",
  "Laboratory safety and compliance",
]

// Inline mobile detection — avoids importing a hook into a public page
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e) => setIsMobile(e.matches)
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

export default function Login() {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()

  const [email,       setEmail]       = useState("")
  const [password,    setPassword]    = useState("")
  const [showPwd,     setShowPwd]     = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [slide,       setSlide]       = useState(0)
  const [fading,      setFading]      = useState(false)

  // Auto-advance slideshow every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setSlide((s) => (s + 1) % SLIDES.length)
        setFading(false)
      }, 600)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const login = async () => {
    if (!email || !password) {
      setError("Please enter your email and password")
      return
    }
    setError(null)
    setLoading(true)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      const userRole = await getRoleForUser(authData.user?.id)
      navigate(userRole === "STUDENT" ? "/student-dashboard" : "/dashboard")
    }
  }

  const onKey = (e) => {
    if (e.key === "Enter") login()
  }

  // ── Shared input style ──────────────────────────────────────────────────
  const inputStyle = {
    width: "100%",
    border: "1.5px solid #e5e7eb",
    borderRadius: "8px",
    padding: "11px 14px",
    fontSize: "0.88rem",
    color: "#111827",
    outline: "none",
    // Critical: prevents inputs from overflowing their container on mobile
    boxSizing: "border-box",
    background: loading ? "#f9fafb" : "#fff",
    // Minimum touch-friendly height
    minHeight: "44px",
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── LEFT: Photo slideshow — hidden on mobile ── */}
      {!isMobile && (
        <div
          style={{
            flex: "1 1 55%",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <img
            src={SLIDES[slide]}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              transition: "opacity 0.6s ease",
              opacity: fading ? 0 : 1,
            }}
          />

          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(10,20,50,0.85) 0%, rgba(10,20,50,0.3) 60%, transparent 100%)",
            }}
          />

          {/* Caption */}
          <div
            style={{
              position: "relative",
              padding: "2.5rem",
              color: "#fff",
              maxWidth: "520px",
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                padding: "6px 14px",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "1rem",
                color: "#93c5fd",
              }}
            >
              DIST Labs · Inventory System
            </div>
            <h1
              style={{
                fontSize: "2.2rem",
                fontWeight: 700,
                lineHeight: 1.2,
                margin: "0 0 0.75rem",
              }}
            >
              Smart Lab Inventory
              <br />
              Management
            </h1>
            <p style={{ fontSize: "0.95rem", opacity: 0.8, margin: "0 0 1.5rem", lineHeight: 1.6 }}>
              {SLIDE_CAPTIONS[slide]}
            </p>

            {/* Slide dots */}
            <div style={{ display: "flex", gap: "6px" }}>
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setFading(true)
                    setTimeout(() => {
                      setSlide(i)
                      setFading(false)
                    }, 300)
                  }}
                  style={{
                    width: i === slide ? "24px" : "8px",
                    height: "8px",
                    borderRadius: "4px",
                    border: "none",
                    background: i === slide ? "#60a5fa" : "rgba(255,255,255,0.35)",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RIGHT: Login form ── */}
      <div
        style={{
          // On mobile: full width. On desktop: fixed 420px.
          flex: isMobile ? "1 1 100%" : "0 0 420px",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "2rem 1.25rem" : "3rem 2.5rem",
          boxShadow: isMobile ? "none" : "-8px 0 40px rgba(0,0,0,0.15)",
          position: "relative",
          zIndex: 1,
          // Ensure form never overflows viewport width on any phone
          width: isMobile ? "100%" : "420px",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img
            src={logoImg}
            alt="DIST Logo"
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              objectFit: "cover",
              boxShadow: "0 4px 20px rgba(30,64,175,0.25)",
              border: "3px solid #dbeafe",
              marginBottom: "1rem",
            }}
          />
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#1e3a8a",
              margin: "0 0 4px",
            }}
          >
            Lab Inventory System
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: 0, letterSpacing: "0.5px" }}>
            DECCA Institute of Science &amp; Technology
          </p>
        </div>

        <div
          style={{
            width: "100%",
            borderTop: "1px solid #f0f0f0",
            marginBottom: "1.75rem",
          }}
        />

        <p
          style={{
            fontSize: "0.9rem",
            color: "#374151",
            fontWeight: 500,
            marginBottom: "1.25rem",
            alignSelf: "flex-start",
            width: "100%",
          }}
        >
          Sign in to your account
        </p>

        {/* Error */}
        {error && (
          <div
            style={{
              width: "100%",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "0.83rem",
              marginBottom: "1rem",
              boxSizing: "border-box",
            }}
          >
            {error}
          </div>
        )}

        {/* Email */}
        <div style={{ width: "100%", marginBottom: "1rem", boxSizing: "border-box" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.78rem",
              fontWeight: 500,
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Email address
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@decohas.ac.tz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKey}
            disabled={loading}
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "#3b82f6" }}
            onBlur={(e)  => { e.target.style.borderColor = "#e5e7eb" }}
          />
        </div>

        {/* Password */}
        <div style={{ width: "100%", marginBottom: "1.5rem", boxSizing: "border-box" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.78rem",
              fontWeight: 500,
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Password
          </label>
          <div style={{ position: "relative", width: "100%", boxSizing: "border-box" }}>
            <input
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKey}
              disabled={loading}
              style={{ ...inputStyle, paddingRight: "44px" }}
              onFocus={(e) => { e.target.style.borderColor = "#3b82f6" }}
              onBlur={(e)  => { e.target.style.borderColor = "#e5e7eb" }}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              tabIndex={-1}
              title={showPwd ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: "#9ca3af",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              {showPwd ? (
                /* Eye-off icon */
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                /* Eye icon */
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={login}
          disabled={loading}
          style={{
            width: "100%",
            background: loading
              ? "#93c5fd"
              : "linear-gradient(135deg, #1d4ed8, #1e40af)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "0.3px",
            boxShadow: loading ? "none" : "0 4px 14px rgba(29,78,216,0.35)",
            transition: "all 0.2s",
            // Touch-friendly height
            minHeight: "48px",
          }}
        >
          {loading ? "Signing in…" : "Sign in →"}
        </button>

        <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
          <p style={{ margin: "0 0 6px", fontSize: "0.8rem", color: "#6b7280" }}>
            New student?{" "}
            <Link
              to="/register"
              style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}
            >
              Register for lab access →
            </Link>
          </p>
        </div>

        <p
          style={{
            fontSize: "0.75rem",
            color: "#9ca3af",
            marginTop: "1rem",
            textAlign: "center",
          }}
        >
          © {new Date().getFullYear()} DIST Labs · All rights reserved
        </p>
      </div>
    </div>
  )
}