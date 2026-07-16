import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { fetchProfile, updateProfile, changePassword } from "../services/profileApi"

const ROLE_LABELS = {
  SUPER_ADMIN:  "Super Admin",
  LAB_MANAGER:  "Lab Manager",
  STORE_KEEPER: "Store Keeper",
  TECHNICIAN:   "Technician",
  AUDITOR:      "Auditor",
  STUDENT:      "Student",
}

const ROLE_COLORS = {
  SUPER_ADMIN:  { bg: "#f3e8ff", color: "#7c3aed" },
  LAB_MANAGER:  { bg: "#dbeafe", color: "#1d4ed8" },
  STORE_KEEPER: { bg: "#dcfce7", color: "#15803d" },
  TECHNICIAN:   { bg: "#fef3c7", color: "#b45309" },
  AUDITOR:      { bg: "#f1f5f9", color: "#475569" },
  STUDENT:      { bg: "#fce7f3", color: "#be185d" },
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function Alert({ msg }) {
  if (!msg) return null
  const ok = msg.type === "success"
  return (
    <div style={{
      marginTop: "12px", padding: "9px 12px", borderRadius: "8px", fontSize: "0.82rem",
      background: ok ? "#f0fdf4" : "#fef2f2",
      color: ok ? "#16a34a" : "#dc2626",
      border: `1px solid ${ok ? "#bbf7d0" : "#fecaca"}`,
    }}>
      {msg.text}
    </div>
  )
}

export default function Profile() {
  const { fullName, role, session, updateFullName } = useAuth()
  const email = session?.user?.email ?? "—"

  const [profile,     setProfile]     = useState(null)
  const [name,        setName]        = useState("")
  const [nameSaving,  setNameSaving]  = useState(false)
  const [nameMsg,     setNameMsg]     = useState(null)

  const [currentPwd,  setCurrentPwd]  = useState("")
  const [newPwd,      setNewPwd]      = useState("")
  const [confirmPwd,  setConfirmPwd]  = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwdSaving,   setPwdSaving]   = useState(false)
  const [pwdMsg,      setPwdMsg]      = useState(null)

  useEffect(() => {
    fetchProfile()
      .then(d => { setProfile(d); setName(d.full_name || "") })
      .catch(() => setName(fullName || ""))
  }, [fullName])

  const initials = (fullName || "?")
    .split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase()

  const roleMeta = ROLE_COLORS[role] ?? ROLE_COLORS.AUDITOR
  const labName  = profile?.laboratories?.name ?? "—"

  const handleSaveName = async (e) => {
    e.preventDefault()
    if (!name.trim() || name.trim() === fullName) return
    setNameSaving(true)
    setNameMsg(null)
    try {
      await updateProfile({ full_name: name.trim() })
      updateFullName(name.trim())
      setNameMsg({ type: "success", text: "Name updated successfully." })
    } catch (err) {
      setNameMsg({ type: "error", text: err.response?.data?.error ?? "Failed to update name." })
    } finally {
      setNameSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdMsg({ type: "error", text: "All fields are required." })
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: "error", text: "New passwords do not match." })
      return
    }
    if (newPwd.length < 6) {
      setPwdMsg({ type: "error", text: "New password must be at least 6 characters." })
      return
    }
    setPwdSaving(true)
    setPwdMsg(null)
    try {
      await changePassword({ current_password: currentPwd, new_password: newPwd })
      setPwdMsg({ type: "success", text: "Password changed successfully." })
      setCurrentPwd("")
      setNewPwd("")
      setConfirmPwd("")
    } catch (err) {
      setPwdMsg({ type: "error", text: err.response?.data?.error ?? "Failed to change password." })
    } finally {
      setPwdSaving(false)
    }
  }

  // ── Shared style tokens ───────────────────────────────────────────────
  const card = {
    background: "#fff", borderRadius: "12px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    border: "1px solid #f1f5f9", padding: "1.5rem",
    marginBottom: "1.25rem",
  }
  const fieldLabel = {
    display: "block", fontSize: "0.78rem",
    fontWeight: 600, color: "#374151", marginBottom: "5px",
  }
  const inp = {
    width: "100%", boxSizing: "border-box",
    border: "1px solid #e2e8f0", borderRadius: "8px",
    padding: "9px 12px", fontSize: "0.85rem",
    outline: "none", color: "#0f172a", background: "#fff",
  }
  const readOnly = { ...inp, background: "#f8fafc", color: "#64748b" }
  const saveBtn = (disabled) => ({
    marginTop: "14px",
    background: disabled ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff", border: "none", borderRadius: "8px",
    padding: "9px 22px", fontSize: "0.83rem", fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "opacity 0.15s",
  })

  return (
    <div style={{ maxWidth: "560px", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Avatar + identity header */}
      <div style={{ ...card, display: "flex", alignItems: "center", gap: "18px" }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          color: "#fff", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "1.4rem", fontWeight: 700,
          boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
        }}>
          {initials}
        </div>
        <div>
          <p style={{ margin: "0 0 5px", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
            {fullName}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{
              background: roleMeta.bg, color: roleMeta.color,
              borderRadius: "6px", padding: "2px 9px",
              fontSize: "0.72rem", fontWeight: 600,
            }}>
              {ROLE_LABELS[role] ?? role}
            </span>
            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{email}</span>
          </div>
          {labName !== "—" && (
            <p style={{ margin: "5px 0 0", fontSize: "0.75rem", color: "#94a3b8" }}>
              🏛 {labName}
            </p>
          )}
        </div>
      </div>

      {/* Edit profile */}
      <div style={card}>
        <h2 style={{ margin: "0 0 1.25rem", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
          Profile Information
        </h2>
        <form onSubmit={handleSaveName}>
          <div style={{ display: "grid", gap: "14px" }}>
            <div>
              <label style={fieldLabel}>Full Name</label>
              <input
                style={inp}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <label style={fieldLabel}>Email</label>
              <input style={readOnly} value={email} readOnly />
            </div>
            <div>
              <label style={fieldLabel}>Role</label>
              <input style={readOnly} value={ROLE_LABELS[role] ?? role ?? "—"} readOnly />
            </div>
          </div>
          <Alert msg={nameMsg} />
          <button
            type="submit"
            disabled={nameSaving || !name.trim() || name.trim() === fullName}
            style={saveBtn(nameSaving || !name.trim() || name.trim() === fullName)}
          >
            {nameSaving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div style={card}>
        <h2 style={{ margin: "0 0 1.25rem", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
          Change Password
        </h2>
        <form onSubmit={handleChangePassword}>
          <div style={{ display: "grid", gap: "14px" }}>
            {[
              { label: "Current Password",     val: currentPwd, set: setCurrentPwd, show: showCurrent, toggle: () => setShowCurrent(s => !s) },
              { label: "New Password",          val: newPwd,     set: setNewPwd,     show: showNew,     toggle: () => setShowNew(s => !s) },
              { label: "Confirm New Password",  val: confirmPwd, set: setConfirmPwd, show: showConfirm, toggle: () => setShowConfirm(s => !s) },
            ].map(({ label: lbl, val, set, show, toggle }) => (
              <div key={lbl}>
                <label style={fieldLabel}>{lbl}</label>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...inp, paddingRight: "42px" }}
                    type={show ? "text" : "password"}
                    value={val}
                    onChange={e => set(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={toggle}
                    style={{
                      position: "absolute", right: "10px", top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none",
                      cursor: "pointer", padding: "2px", color: "#94a3b8",
                      display: "flex", alignItems: "center",
                    }}
                  >
                    <EyeIcon open={show} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Alert msg={pwdMsg} />
          <button
            type="submit"
            disabled={pwdSaving}
            style={saveBtn(pwdSaving)}
          >
            {pwdSaving ? "Updating…" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  )
}
