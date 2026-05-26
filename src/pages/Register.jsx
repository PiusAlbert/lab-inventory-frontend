import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { registerStudent, fetchPublicLabs } from "../services/studentsApi"
import logoImg from "../assets/logo.jpg"

const inp = {
  width: "100%", border: "1px solid #e2e8f0", borderRadius: "8px",
  padding: "10px 12px", fontSize: "0.85rem", color: "#0f172a",
  outline: "none", boxSizing: "border-box", background: "#fff",
}
const lbl = { display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }

function Field({ label, children, required }) {
  return (
    <div>
      <span style={lbl}>{label}{required && <span style={{ color: "#dc2626" }}> *</span>}</span>
      {children}
    </div>
  )
}

const COURSE_LEVELS = ["UNDERGRADUATE", "POSTGRADUATE", "PHD", "DIPLOMA", "CERTIFICATE"]

export default function Register() {
  const navigate = useNavigate()

  const [labs,      setLabs]      = useState([])
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(null)
  const [error,     setError]     = useState(null)
  const [step,      setStep]      = useState(1)  // 1 = account, 2 = student details

  const [form, setForm] = useState({
    full_name: "", email: "", password: "", confirm_password: "",
    student_number: "", department: "", course_name: "", course_level: "UNDERGRADUATE",
    year_of_study: "", supervisor_name: "", preferred_laboratory_id: "",
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  useEffect(() => {
    fetchPublicLabs()
      .then(setLabs)
      .catch(() => setLabs([]))
  }, [])

  const validateStep1 = () => {
    if (!form.full_name.trim())  return "Full name is required"
    if (!form.email.trim())      return "Email is required"
    if (!form.password)          return "Password is required"
    if (form.password.length < 8) return "Password must be at least 8 characters"
    if (form.password !== form.confirm_password) return "Passwords do not match"
    return null
  }

  const handleNext = () => {
    const err = validateStep1()
    if (err) { setError(err); return }
    setError(null)
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.preferred_laboratory_id) { setError("Please select a laboratory"); return }
    setLoading(true)
    setError(null)
    try {
      const result = await registerStudent({
        full_name:               form.full_name.trim(),
        email:                   form.email.trim().toLowerCase(),
        password:                form.password,
        student_number:          form.student_number.trim() || undefined,
        department:              form.department.trim()     || undefined,
        course_name:             form.course_name.trim()   || undefined,
        course_level:            form.course_level,
        year_of_study:           form.year_of_study        || undefined,
        supervisor_name:         form.supervisor_name.trim() || undefined,
        preferred_laboratory_id: form.preferred_laboratory_id,
      })
      setSuccess(result.message)
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", padding: "1rem" }}>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "2.5rem", maxWidth: "420px", width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔬</div>
          <h2 style={{ margin: "0 0 8px", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>Registration Submitted</h2>
          <p style={{ margin: "0 0 1.5rem", fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6 }}>{success}</p>
          <p style={{ margin: "0 0 1.5rem", fontSize: "0.82rem", color: "#94a3b8" }}>
            You will receive access once the lab manager reviews your request. You can then sign in normally.
          </p>
          <button onClick={() => navigate("/")} style={{
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff",
            border: "none", borderRadius: "8px", padding: "11px 24px",
            fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", width: "100%",
          }}>
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", padding: "1rem" }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "2rem", maxWidth: "520px", width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.75rem" }}>
          <img src={logoImg} alt="Lab" style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }} />
          <div>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Student Registration</p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>DECOHAS Lab Inventory</p>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: "4px", borderRadius: "2px", background: step >= s ? "#2563eb" : "#e2e8f0", transition: "background 0.2s" }} />
          ))}
        </div>
        <p style={{ margin: "0 0 1.25rem", fontSize: "0.78rem", color: "#64748b" }}>
          Step {step} of 2 — {step === 1 ? "Account details" : "Academic details & lab selection"}
        </p>

        {error && (
          <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px", padding: "10px 14px", fontSize: "0.82rem", color: "#be123c", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext() } : handleSubmit}>

          {step === 1 && (
            <div style={{ display: "grid", gap: "1rem" }}>
              <Field label="Full Name" required>
                <input style={inp} value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Jane Doe" autoComplete="name" />
              </Field>
              <Field label="Email Address" required>
                <input style={inp} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jane@university.edu" autoComplete="email" />
              </Field>
              <Field label="Password" required>
                <input style={inp} type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
              </Field>
              <Field label="Confirm Password" required>
                <input style={inp} type="password" value={form.confirm_password} onChange={e => set("confirm_password", e.target.value)} autoComplete="new-password" />
              </Field>
              <button type="submit" style={{
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff",
                border: "none", borderRadius: "8px", padding: "11px", fontSize: "0.85rem",
                fontWeight: 600, cursor: "pointer", marginTop: "0.25rem",
              }}>
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="Student Number">
                  <input style={inp} value={form.student_number} onChange={e => set("student_number", e.target.value)} placeholder="STU-2024-001" />
                </Field>
                <Field label="Year of Study">
                  <input style={inp} type="number" min="1" max="8" value={form.year_of_study} onChange={e => set("year_of_study", e.target.value)} placeholder="1" />
                </Field>
              </div>
              <Field label="Department">
                <input style={inp} value={form.department} onChange={e => set("department", e.target.value)} placeholder="e.g. Chemistry" />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                <Field label="Course / Programme">
                  <input style={inp} value={form.course_name} onChange={e => set("course_name", e.target.value)} placeholder="e.g. B.Sc. Analytical Chemistry" />
                </Field>
                <Field label="Level">
                  <select style={{ ...inp, cursor: "pointer" }} value={form.course_level} onChange={e => set("course_level", e.target.value)}>
                    {COURSE_LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Supervisor Name">
                <input style={inp} value={form.supervisor_name} onChange={e => set("supervisor_name", e.target.value)} placeholder="Dr. Smith (optional)" />
              </Field>
              <Field label="Laboratory to Register With" required>
                <select style={{ ...inp, cursor: "pointer" }} value={form.preferred_laboratory_id} onChange={e => set("preferred_laboratory_id", e.target.value)}>
                  <option value="">— Select a laboratory —</option>
                  {labs.map(l => <option key={l.id} value={l.id}>{l.name}{l.location ? ` — ${l.location}` : ""}</option>)}
                </select>
                <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#94a3b8" }}>
                  The lab manager will review and approve your registration.
                </p>
              </Field>

              <div style={{ display: "flex", gap: "8px", marginTop: "0.25rem" }}>
                <button type="button" onClick={() => { setStep(1); setError(null) }} style={{
                  flex: 1, border: "1px solid #e2e8f0", borderRadius: "8px", padding: "11px",
                  fontSize: "0.85rem", background: "#fff", color: "#374151", cursor: "pointer",
                }}>
                  ← Back
                </button>
                <button type="submit" disabled={loading} style={{
                  flex: 2, background: loading ? "#93c5fd" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "#fff", border: "none", borderRadius: "8px", padding: "11px",
                  fontSize: "0.85rem", fontWeight: 600, cursor: loading ? "default" : "pointer",
                }}>
                  {loading ? "Submitting…" : "Submit Registration"}
                </button>
              </div>
            </div>
          )}
        </form>

        <p style={{ margin: "1.25rem 0 0", textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>
          Already have an account?{" "}
          <Link to="/" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
