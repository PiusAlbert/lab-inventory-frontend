import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

/**
 * Place all images in src/assets/:
 *   logo.jpg
 *   lab-beaker.jpg
 *   lab-bw-glass.jpg
 *   lab-colorful.jpg
 *   lab-glassware.jpg
 *   lab-microscope.jpg
 *   lab-researcher.jpg
 */
import logoImg  from "../assets/logo.jpg"
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

export default function Login() {
  const navigate = useNavigate()

  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [slide,    setSlide]    = useState(0)
  const [fading,   setFading]   = useState(false)

  // Auto-advance slideshow every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setSlide(s => (s + 1) % SLIDES.length)
        setFading(false)
      }, 600)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const login = async () => {
    if (!email || !password) { setError("Please enter your email and password"); return }
    setError(null)
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false) }
    else navigate("/dashboard")
  }

  const onKey = e => { if (e.key === "Enter") login() }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── LEFT PANEL: Photo Slideshow ──────────── */}
      <div style={{
        flex: "1 1 55%",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
      }}>
        <img
          src={SLIDES[slide]}
          alt=""
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            transition: "opacity 0.6s ease",
            opacity: fading ? 0 : 1,
          }}
        />

        {/* Dark gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(10,20,50,0.85) 0%, rgba(10,20,50,0.3) 60%, transparent 100%)",
        }} />

        {/* Brand + caption */}
        <div style={{ position: "relative", padding: "2.5rem", color: "#fff", maxWidth: "520px" }}>
          <div style={{
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
          }}>
            DECOHAS Labs · Inventory System
          </div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 700, lineHeight: 1.2, margin: "0 0 0.75rem" }}>
            Smart Lab Inventory<br />Management
          </h1>
          <p style={{ fontSize: "0.95rem", opacity: 0.8, margin: "0 0 1.5rem", lineHeight: 1.6 }}>
            {SLIDE_CAPTIONS[slide]}
          </p>

          {/* Slide indicator dots */}
          <div style={{ display: "flex", gap: "6px" }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setFading(true)
                  setTimeout(() => { setSlide(i); setFading(false) }, 300)
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

      {/* ── RIGHT PANEL: Login Form ───────────────── */}
      <div style={{
        flex: "0 0 420px",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 2.5rem",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        position: "relative",
        zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img
            src={logoImg}
            alt="DIST Logo"
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              objectFit: "cover",
              boxShadow: "0 4px 20px rgba(30,64,175,0.25)",
              border: "3px solid #dbeafe",
              marginBottom: "1rem",
            }}
          />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e3a8a", margin: "0 0 4px" }}>
            Lab Inventory System
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: 0, letterSpacing: "0.5px" }}>
            DECCA Institute of Science & Technology
          </p>
        </div>

        {/* Divider */}
        <div style={{ width: "100%", borderTop: "1px solid #f0f0f0", marginBottom: "1.75rem" }} />

        <p style={{ fontSize: "0.9rem", color: "#374151", fontWeight: 500, marginBottom: "1.25rem", alignSelf: "flex-start" }}>
          Sign in to your account
        </p>

        {/* Error */}
        {error && (
          <div style={{
            width: "100%",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "0.83rem",
            marginBottom: "1rem",
          }}>
            {error}
          </div>
        )}

        {/* Email */}
        <div style={{ width: "100%", marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
            Email address
          </label>
          <input
            type="email"
            placeholder="you@decohas.ac.tz"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={onKey}
            disabled={loading}
            style={{
              width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "8px",
              padding: "10px 14px", fontSize: "0.88rem", color: "#111827",
              outline: "none", boxSizing: "border-box",
              background: loading ? "#f9fafb" : "#fff",
            }}
            onFocus={e => e.target.style.borderColor = "#3b82f6"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          />
        </div>

        {/* Password */}
        <div style={{ width: "100%", marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={onKey}
            disabled={loading}
            style={{
              width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "8px",
              padding: "10px 14px", fontSize: "0.88rem", color: "#111827",
              outline: "none", boxSizing: "border-box",
              background: loading ? "#f9fafb" : "#fff",
            }}
            onFocus={e => e.target.style.borderColor = "#3b82f6"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          />
        </div>

        {/* Button */}
        <button
          onClick={login}
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "#93c5fd" : "linear-gradient(135deg, #1d4ed8, #1e40af)",
            color: "#fff", border: "none", borderRadius: "8px",
            padding: "11px", fontSize: "0.9rem", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "0.3px",
            boxShadow: "0 4px 14px rgba(29,78,216,0.35)",
            transition: "all 0.2s",
          }}
        >
          {loading ? "Signing in…" : "Sign in →"}
        </button>

        <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "2rem", textAlign: "center" }}>
          © {new Date().getFullYear()} DECOHAS Labs · All rights reserved
        </p>
      </div>

    </div>
  )
}