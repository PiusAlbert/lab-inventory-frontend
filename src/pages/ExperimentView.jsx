import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { fetchExperimentById, submitExperiment, approveExperiment, rejectExperiment } from "../services/experimentsApi"
import { useAuth } from "../context/AuthContext"

const STATUS_STYLE = {
  DRAFT:       { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
  IN_PROGRESS: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  SUBMITTED:   { bg: "#fefce8", color: "#854d0e", border: "#fde68a" },
  APPROVED:    { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  REJECTED:    { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
}

function SectionCard({ title, children, empty }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem", marginBottom: "1rem" }}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
        {title}
      </h3>
      {empty ? <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8" }}>{empty}</p> : children}
    </div>
  )
}

function Chip({ label, value, color = "#374151" }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>{label}</span>
      <span style={{ fontSize: "0.85rem", color }}>{value || "—"}</span>
    </div>
  )
}

function Grid({ cols = 3, children }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "1rem" }}>{children}</div>
}

export default function ExperimentView() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()

  const [exp,       setExp]       = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [actioning, setActioning] = useState(false)
  const [rejectComment, setRejectComment] = useState("")
  const [showReject, setShowReject] = useState(false)

  const isManager = ["LAB_MANAGER", "SUPER_ADMIN", "ADMIN"].includes(role)

  useEffect(() => {
    fetchExperimentById(id)
      .then(setExp)
      .catch(() => setError("Experiment not found"))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async () => {
    if (!window.confirm("Submit for review?")) return
    setActioning(true)
    try { const r = await submitExperiment(id); setExp(e => ({ ...e, status: r.status })) }
    catch (e) { alert(e.response?.data?.error || "Failed") }
    finally { setActioning(false) }
  }

  const handleApprove = async () => {
    if (!window.confirm("Approve this experiment?")) return
    setActioning(true)
    try { const r = await approveExperiment(id); setExp(e => ({ ...e, status: r.status })) }
    catch (e) { alert(e.response?.data?.error || "Failed") }
    finally { setActioning(false) }
  }

  const handleReject = async () => {
    if (!rejectComment.trim()) return alert("Please provide a reason for rejection")
    setActioning(true)
    try { const r = await rejectExperiment(id, { comment: rejectComment }); setExp(e => ({ ...e, status: r.status })); setShowReject(false) }
    catch (e) { alert(e.response?.data?.error || "Failed") }
    finally { setActioning(false) }
  }

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Loading…</div>
  if (error || !exp) return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <p style={{ color: "#be123c" }}>{error || "Not found"}</p>
      <button onClick={() => navigate("/experiments")} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer" }}>← Back</button>
    </div>
  )

  const s  = STATUS_STYLE[exp.status] || STATUS_STYLE.DRAFT
  const steps = [...(exp.experiment_procedure_steps || [])].sort((a, b) => a.step_number - b.step_number)

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <button onClick={() => navigate("/experiments")} style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.82rem", cursor: "pointer", padding: 0, marginBottom: "4px" }}>
            ← Back to Experiments
          </button>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>{exp.title}</h1>
          <div style={{ marginTop: "6px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ padding: "3px 12px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 600,
              background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
              {exp.status.replace("_", " ")}
            </span>
            {exp.course_module && <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{exp.course_module}</span>}
            {exp.session_date && <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{new Date(exp.session_date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["DRAFT", "IN_PROGRESS", "REJECTED"].includes(exp.status) && (
            <button onClick={() => navigate(`/experiments/${id}/edit`)} style={{
              background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8",
              borderRadius: "8px", padding: "8px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
            }}>Edit</button>
          )}
          {["DRAFT", "IN_PROGRESS"].includes(exp.status) && (
            <button onClick={handleSubmit} disabled={actioning} style={{
              background: "#059669", color: "#fff", border: "none", borderRadius: "8px",
              padding: "8px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: actioning ? "default" : "pointer",
            }}>Submit for Review</button>
          )}
          {isManager && exp.status === "SUBMITTED" && (
            <>
              <button onClick={handleApprove} disabled={actioning} style={{
                background: "#15803d", color: "#fff", border: "none", borderRadius: "8px",
                padding: "8px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: actioning ? "default" : "pointer",
              }}>Approve</button>
              <button onClick={() => setShowReject(true)} disabled={actioning} style={{
                background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c",
                borderRadius: "8px", padding: "8px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
              }}>Reject</button>
            </>
          )}
        </div>
      </div>

      {/* Rejection note */}
      {exp.status === "REJECTED" && exp.rejection_comment && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px", padding: "12px 16px", marginBottom: "1rem", fontSize: "0.85rem", color: "#be123c" }}>
          <strong>Rejected:</strong> {exp.rejection_comment}
        </div>
      )}

      {/* 1. Admin */}
      <SectionCard title="1. Administrative Details">
        <Grid cols={3}>
          <Chip label="Instructor" value={exp.app_users?.full_name} />
          <Chip label="Session Date" value={exp.session_date ? new Date(exp.session_date).toLocaleDateString("en-GB") : null} />
          <Chip label="Protocol Reference" value={exp.protocol_reference} />
        </Grid>
        {exp.objective && <div style={{ marginTop: "8px" }}><Chip label="Objective" value={exp.objective} /></div>}
        {(exp.experiment_participants || []).length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>Participants</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {exp.experiment_participants.map(p => (
                <span key={p.id} style={{ padding: "3px 10px", background: "#f1f5f9", borderRadius: "999px", fontSize: "0.78rem", color: "#374151" }}>
                  {p.app_users?.full_name || p.user_id} — {p.role}
                </span>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* 2. Setup */}
      <SectionCard title="2. Experimental Setup"
        empty={(exp.experiment_materials || []).length === 0 && (exp.experiment_equipment || []).length === 0 ? "No setup recorded" : null}>
        {(exp.experiment_materials || []).length > 0 && (
          <>
            <p style={{ margin: "0 0 8px", fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Materials & Reagents</p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Name","Quantity","Lot Number","Linked Item"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", fontSize: "0.72rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exp.experiment_materials.map((m, i) => (
                  <tr key={m.id} style={{ borderTop: i > 0 ? "1px solid #f1f5f9" : "none" }}>
                    <td style={{ padding: "8px 12px", fontSize: "0.82rem", color: "#0f172a", fontWeight: 500 }}>{m.material_name}</td>
                    <td style={{ padding: "8px 12px", fontSize: "0.82rem", color: "#374151" }}>{m.quantity_used} {m.unit}</td>
                    <td style={{ padding: "8px 12px", fontSize: "0.82rem", color: "#374151" }}>{m.lot_number || "—"}</td>
                    <td style={{ padding: "8px 12px", fontSize: "0.82rem", color: "#374151" }}>{m.items?.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {(exp.experiment_equipment || []).length > 0 && (
          <>
            <p style={{ margin: "0 0 8px", fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Equipment</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
              {exp.experiment_equipment.map(e => (
                <div key={e.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px" }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>{e.equipment_name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                    {e.model_serial ? `S/N: ${e.model_serial} · ` : ""}{e.calibration_status}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
        {exp.experiment_safety && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ margin: "0 0 8px", fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Safety</p>
            <Grid cols={3}>
              <Chip label="Hazard Level" value={exp.experiment_safety.hazard_level} color={exp.experiment_safety.hazard_level === "HIGH" || exp.experiment_safety.hazard_level === "EXTREME" ? "#dc2626" : "#374151"} />
              <Chip label="Fume Hood" value={exp.experiment_safety.fume_hood_used ? "Yes" : "No"} />
              <Chip label="BSL" value={exp.experiment_safety.biosafety_level} />
            </Grid>
            {(exp.experiment_safety.ppe_used || []).length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                {exp.experiment_safety.ppe_used.map(p => (
                  <span key={p} style={{ padding: "3px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "999px", fontSize: "0.75rem", color: "#15803d" }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* 3. Procedure */}
      <SectionCard title="3. Procedural Details" empty={steps.length === 0 ? "No procedure steps recorded" : null}>
        {steps.map(s => (
          <div key={s.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#2563eb", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>
              {s.step_number}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#0f172a" }}>{s.description}</p>
              {Object.keys(s.conditions || {}).length > 0 && (
                <div style={{ marginTop: "4px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {Object.entries(s.conditions).map(([k, v]) => (
                    <span key={k} style={{ padding: "1px 7px", background: "#f1f5f9", borderRadius: "6px", fontSize: "0.72rem", color: "#475569" }}>{k}: {v}</span>
                  ))}
                </div>
              )}
              {s.is_deviation && <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#854d0e" }}>⚠ Deviation: {s.deviation_note}</p>}
            </div>
          </div>
        ))}
        {(exp.experiment_controls || []).length > 0 && (
          <>
            <p style={{ margin: "1rem 0 8px", fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Controls & Standards</p>
            {exp.experiment_controls.map(c => (
              <div key={c.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px 12px", marginBottom: "6px" }}>
                <span style={{ padding: "1px 7px", background: "#f1f5f9", borderRadius: "6px", fontSize: "0.7rem", marginRight: "8px" }}>{c.control_type}</span>
                <span style={{ fontSize: "0.82rem", color: "#0f172a" }}>{c.description}</span>
                {c.expected_value && <span style={{ fontSize: "0.78rem", color: "#64748b", marginLeft: "12px" }}>Expected: {c.expected_value}{c.unit ? ` ${c.unit}` : ""} · Actual: {c.actual_value || "—"}</span>}
              </div>
            ))}
          </>
        )}
      </SectionCard>

      {/* 4. Observations */}
      <SectionCard title="4. Observations & Data" empty={(exp.experiment_observations || []).length === 0 ? "No observations recorded" : null}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
          {(exp.experiment_observations || []).map(o => (
            <div key={o.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px" }}>
              <span style={{ padding: "1px 7px", background: "#f1f5f9", borderRadius: "6px", fontSize: "0.68rem", color: "#475569" }}>{o.observation_type}</span>
              <p style={{ margin: "6px 0 2px", fontWeight: 600, fontSize: "0.82rem", color: "#0f172a" }}>{o.label}</p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#374151", fontWeight: 500 }}>
                {o.value || "—"}{o.unit ? ` ${o.unit}` : ""}{o.replicate_number ? <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}> Rep {o.replicate_number}</span> : ""}
              </p>
              {o.notes && <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748b" }}>{o.notes}</p>}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 5. Results */}
      <SectionCard title="5. Results & Analysis" empty={(exp.experiment_results || []).length === 0 ? "No results recorded" : null}>
        {(exp.experiment_results || []).map(r => (
          <div key={r.id} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>{r.label}</span>
                <span style={{ padding: "1px 7px", background: "#f1f5f9", borderRadius: "6px", fontSize: "0.7rem", color: "#475569" }}>{r.result_type}</span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#374151" }}>
                <strong style={{ color: "#0f172a" }}>{r.value ?? "—"}{r.unit ? ` ${r.unit}` : ""}</strong>
                {r.expected_value !== null && r.expected_value !== undefined ? ` · Expected: ${r.expected_value}${r.unit ? ` ${r.unit}` : ""}` : ""}
                {r.deviation_percent !== null && r.deviation_percent !== undefined ? ` · Δ ${r.deviation_percent}%` : ""}
                {r.uncertainty !== null && r.uncertainty !== undefined ? ` · ±${r.uncertainty}` : ""}
              </p>
              {r.method && <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748b" }}>Method: {r.method}</p>}
            </div>
          </div>
        ))}
      </SectionCard>

      {/* 6. Conclusions */}
      {exp.experiment_conclusions && (
        <SectionCard title="6. Conclusions & Reflections">
          {[
            { l: "Key Findings", v: exp.experiment_conclusions.key_findings },
            { l: "Sources of Error", v: exp.experiment_conclusions.error_sources },
            { l: "Limitations", v: exp.experiment_conclusions.limitations },
            { l: "Suggestions for Improvement", v: exp.experiment_conclusions.improvement_suggestions },
            { l: "Follow-up Experiments", v: exp.experiment_conclusions.follow_up_experiments },
          ].filter(f => f.v).map(f => (
            <div key={f.l} style={{ marginBottom: "0.75rem" }}>
              <p style={{ margin: "0 0 2px", fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.l}</p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#374151", whiteSpace: "pre-wrap" }}>{f.v}</p>
            </div>
          ))}
        </SectionCard>
      )}

      {/* 7. Compliance */}
      {((exp.experiment_waste_records || []).length > 0 || (exp.experiment_ethical_approvals || []).length > 0 || (exp.experiment_signatures || []).length > 0) && (
        <SectionCard title="7. Compliance & Traceability">
          {(exp.experiment_waste_records || []).length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Waste Records</p>
              {exp.experiment_waste_records.map(w => (
                <div key={w.id} style={{ background: "#f8fafc", borderRadius: "8px", padding: "8px 12px", marginBottom: "6px", fontSize: "0.82rem", color: "#374151" }}>
                  <strong>{w.waste_type}</strong> — {w.waste_description}{w.quantity ? ` · ${w.quantity} ${w.unit || ""}` : ""}{w.disposal_date ? ` · Disposed ${w.disposal_date}` : ""}
                </div>
              ))}
            </div>
          )}
          {(exp.experiment_ethical_approvals || []).length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Approvals</p>
              {exp.experiment_ethical_approvals.map(a => (
                <div key={a.id} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "8px 12px", marginBottom: "6px", fontSize: "0.82rem" }}>
                  <strong style={{ color: "#15803d" }}>{a.approval_type}</strong>
                  {a.approval_number ? ` — ${a.approval_number}` : ""}{a.approving_body ? ` · ${a.approving_body}` : ""}
                </div>
              ))}
            </div>
          )}
          {(exp.experiment_signatures || []).length > 0 && (
            <div>
              <p style={{ margin: "0 0 8px", fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Signatures</p>
              {exp.experiment_signatures.map(sig => (
                <div key={sig.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#0f172a" }}>{sig.app_users?.full_name || "Unknown"}</span>
                    <span style={{ fontSize: "0.78rem", color: "#64748b", marginLeft: "8px" }}>{sig.signer_role}</span>
                  </div>
                  <span style={{
                    padding: "2px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 600,
                    background: sig.status === "SIGNED" ? "#f0fdf4" : sig.status === "REJECTED" ? "#fff1f2" : "#f8fafc",
                    color: sig.status === "SIGNED" ? "#15803d" : sig.status === "REJECTED" ? "#be123c" : "#64748b",
                    border: `1px solid ${sig.status === "SIGNED" ? "#bbf7d0" : sig.status === "REJECTED" ? "#fecdd3" : "#e2e8f0"}`,
                  }}>{sig.status}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Reject modal */}
      {showReject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", maxWidth: "420px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Reject Experiment</h3>
            <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "#64748b" }}>Provide a reason so the author can address the issues.</p>
            <textarea
              value={rejectComment}
              onChange={e => setRejectComment(e.target.value)}
              placeholder="What needs to be corrected?"
              style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px 12px", fontSize: "0.85rem", minHeight: "100px", resize: "vertical", boxSizing: "border-box", outline: "none" }}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button onClick={() => setShowReject(false)} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px 16px", fontSize: "0.82rem", background: "#fff", color: "#374151", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleReject} disabled={actioning} style={{ border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "0.82rem", background: "#dc2626", color: "#fff", cursor: actioning ? "default" : "pointer", fontWeight: 600 }}>
                {actioning ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
