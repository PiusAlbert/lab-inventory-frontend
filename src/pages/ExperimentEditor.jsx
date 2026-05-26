import { useEffect, useState, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import {
  createExperiment, fetchExperimentById, updateExperiment, submitExperiment,
  addMaterial, updateMaterial, deleteMaterial,
  addEquipment, updateEquipment, deleteEquipment,
  upsertSafety,
  addStep, updateStep, deleteStep,
  addControl, updateControl, deleteControl,
  addObservation, updateObservation, deleteObservation,
  addResult, updateResult, deleteResult,
  upsertConclusions,
  addWasteRecord, deleteWasteRecord,
  addEthicalApproval, deleteEthicalApproval,
} from "../services/experimentsApi"
import { fetchItems } from "../services/itemsApi"

const TABS = [
  { id: "admin",      label: "1. Admin" },
  { id: "setup",      label: "2. Setup" },
  { id: "procedure",  label: "3. Procedure" },
  { id: "data",       label: "4. Data" },
  { id: "results",    label: "5. Results" },
  { id: "conclusions",label: "6. Conclusions" },
  { id: "compliance", label: "7. Compliance" },
]

const inp = {
  width: "100%", border: "1px solid #e2e8f0", borderRadius: "8px",
  padding: "8px 12px", fontSize: "0.85rem", color: "#0f172a",
  outline: "none", boxSizing: "border-box", background: "#fff",
}
const label = { display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }
const row   = { display: "grid", gap: "1rem", marginBottom: "1rem" }
const card  = { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", marginBottom: "0.75rem" }

function Field({ l, children }) {
  return (
    <div>
      <span style={label}>{l}</span>
      {children}
    </div>
  )
}

function RemoveBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c",
      borderRadius: "6px", padding: "4px 10px", fontSize: "0.72rem", cursor: "pointer", flexShrink: 0,
    }}>Remove</button>
  )
}

function AddBtn({ onClick, label: lbl }) {
  return (
    <button onClick={onClick} style={{
      background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8",
      borderRadius: "7px", padding: "7px 14px", fontSize: "0.8rem",
      fontWeight: 600, cursor: "pointer", marginTop: "0.5rem",
    }}>+ {lbl}</button>
  )
}

// ── Tab: Admin ────────────────────────────────────────────────────────
function AdminTab({ form, onChange, saving }) {
  return (
    <div>
      <div style={{ ...row, gridTemplateColumns: "1fr 1fr" }}>
        <Field l="Experiment Title *">
          <input style={inp} value={form.title} onChange={e => onChange("title", e.target.value)} placeholder="e.g. Acid-Base Titration" />
        </Field>
        <Field l="Course / Module">
          <input style={inp} value={form.course_module} onChange={e => onChange("course_module", e.target.value)} placeholder="e.g. CHM 301" />
        </Field>
      </div>
      <div style={{ ...row, gridTemplateColumns: "1fr 1fr 1fr" }}>
        <Field l="Session Date *">
          <input type="date" style={inp} value={form.session_date} onChange={e => onChange("session_date", e.target.value)} />
        </Field>
        <Field l="Start Time">
          <input type="time" style={inp} value={form.session_start} onChange={e => onChange("session_start", e.target.value)} />
        </Field>
        <Field l="End Time">
          <input type="time" style={inp} value={form.session_end} onChange={e => onChange("session_end", e.target.value)} />
        </Field>
      </div>
      <div style={{ ...row, gridTemplateColumns: "1fr 1fr" }}>
        <Field l="Protocol / SOP Reference">
          <input style={inp} value={form.protocol_reference} onChange={e => onChange("protocol_reference", e.target.value)} placeholder="e.g. SOP-CHM-041" />
        </Field>
      </div>
      <Field l="Objective">
        <textarea style={{ ...inp, minHeight: "90px", resize: "vertical" }} value={form.objective}
          onChange={e => onChange("objective", e.target.value)} placeholder="What does this experiment aim to determine or demonstrate?" />
      </Field>
    </div>
  )
}

// ── Tab: Setup ────────────────────────────────────────────────────────
function SetupTab({ expId, data, onReload, items }) {
  const [matForm, setMatForm] = useState({ material_name: "", quantity_used: "", unit: "", lot_number: "", item_id: "", batch_id: "", notes: "" })
  const [eqForm,  setEqForm]  = useState({ equipment_name: "", model_serial: "", calibration_status: "N/A", calibration_date: "", item_id: "", notes: "" })
  const [safety,  setSafety]  = useState(data.experiment_safety?.[0] || { ppe_used: [], fume_hood_used: false, fume_hood_id: "", hazard_level: "LOW", biosafety_level: "", other_precautions: "" })
  const [saving,  setSaving]  = useState(false)

  const PPE_OPTIONS = ["Gloves", "Goggles", "Lab coat", "Face shield", "Apron", "Respirator", "Ear protection"]

  const togglePpe = (item) => {
    setSafety(s => ({ ...s, ppe_used: s.ppe_used.includes(item) ? s.ppe_used.filter(p => p !== item) : [...s.ppe_used, item] }))
  }

  const saveSafety = async () => {
    setSaving(true)
    try { await upsertSafety(expId, safety) } catch (e) { alert(e.response?.data?.error || "Save failed") }
    finally { setSaving(false) }
  }

  const addMat = async () => {
    if (!matForm.material_name.trim() || !matForm.quantity_used || !matForm.unit.trim()) return alert("Name, quantity and unit are required")
    try {
      await addMaterial(expId, { ...matForm, item_id: matForm.item_id || null, batch_id: matForm.batch_id || null })
      setMatForm({ material_name: "", quantity_used: "", unit: "", lot_number: "", item_id: "", batch_id: "", notes: "" })
      onReload()
    } catch (e) { alert(e.response?.data?.error || "Failed to add material") }
  }

  const addEq = async () => {
    if (!eqForm.equipment_name.trim()) return alert("Equipment name is required")
    try {
      await addEquipment(expId, { ...eqForm, item_id: eqForm.item_id || null })
      setEqForm({ equipment_name: "", model_serial: "", calibration_status: "N/A", calibration_date: "", item_id: "", notes: "" })
      onReload()
    } catch (e) { alert(e.response?.data?.error || "Failed to add equipment") }
  }

  const removeMat = async (mid) => { try { await deleteMaterial(expId, mid); onReload() } catch (e) { alert(e.response?.data?.error || "Failed") } }
  const removeEq  = async (eid) => { try { await deleteEquipment(expId, eid); onReload() } catch (e) { alert(e.response?.data?.error || "Failed") } }

  return (
    <div>
      {/* Materials */}
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>Materials & Reagents</h3>
      {(data.experiment_materials || []).map(m => (
        <div key={m.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>{m.material_name}</p>
            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#64748b" }}>
              {m.quantity_used} {m.unit}{m.lot_number ? ` · Lot: ${m.lot_number}` : ""}{m.items ? ` · ${m.items.name}` : ""}
            </p>
          </div>
          <RemoveBtn onClick={() => removeMat(m.id)} />
        </div>
      ))}
      <div style={card}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Add Material</p>
        <div style={{ ...row, gridTemplateColumns: "2fr 1fr 1fr" }}>
          <Field l="Name *"><input style={inp} value={matForm.material_name} onChange={e => setMatForm(f => ({ ...f, material_name: e.target.value }))} placeholder="Sodium hydroxide" /></Field>
          <Field l="Quantity *"><input style={inp} type="number" value={matForm.quantity_used} onChange={e => setMatForm(f => ({ ...f, quantity_used: e.target.value }))} placeholder="10" /></Field>
          <Field l="Unit *"><input style={inp} value={matForm.unit} onChange={e => setMatForm(f => ({ ...f, unit: e.target.value }))} placeholder="ml" /></Field>
        </div>
        <div style={{ ...row, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <Field l="Lot Number"><input style={inp} value={matForm.lot_number} onChange={e => setMatForm(f => ({ ...f, lot_number: e.target.value }))} placeholder="LOT-20240101" /></Field>
          <Field l="Link to Inventory Item">
            <select style={{ ...inp, cursor: "pointer" }} value={matForm.item_id} onChange={e => setMatForm(f => ({ ...f, item_id: e.target.value }))}>
              <option value="">— not linked —</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </Field>
          <Field l="Notes"><input style={inp} value={matForm.notes} onChange={e => setMatForm(f => ({ ...f, notes: e.target.value }))} /></Field>
        </div>
        <AddBtn onClick={addMat} label="Add Material" />
      </div>

      {/* Equipment */}
      <h3 style={{ margin: "1.5rem 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>Equipment & Instruments</h3>
      {(data.experiment_equipment || []).map(e => (
        <div key={e.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>{e.equipment_name}</p>
            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#64748b" }}>
              {e.model_serial ? `S/N: ${e.model_serial} · ` : ""}{e.calibration_status}
              {e.calibration_date ? ` (calibrated ${e.calibration_date})` : ""}
            </p>
          </div>
          <RemoveBtn onClick={() => removeEq(e.id)} />
        </div>
      ))}
      <div style={card}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Add Equipment</p>
        <div style={{ ...row, gridTemplateColumns: "2fr 1fr" }}>
          <Field l="Equipment Name *"><input style={inp} value={eqForm.equipment_name} onChange={e => setEqForm(f => ({ ...f, equipment_name: e.target.value }))} placeholder="pH Meter" /></Field>
          <Field l="Model / Serial No."><input style={inp} value={eqForm.model_serial} onChange={e => setEqForm(f => ({ ...f, model_serial: e.target.value }))} /></Field>
        </div>
        <div style={{ ...row, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <Field l="Calibration Status">
            <select style={{ ...inp, cursor: "pointer" }} value={eqForm.calibration_status} onChange={e => setEqForm(f => ({ ...f, calibration_status: e.target.value }))}>
              {["N/A", "CALIBRATED", "UNCALIBRATED", "OVERDUE"].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field l="Calibration Date"><input type="date" style={inp} value={eqForm.calibration_date} onChange={e => setEqForm(f => ({ ...f, calibration_date: e.target.value }))} /></Field>
          <Field l="Link to Inventory">
            <select style={{ ...inp, cursor: "pointer" }} value={eqForm.item_id} onChange={e => setEqForm(f => ({ ...f, item_id: e.target.value }))}>
              <option value="">— not linked —</option>
              {items.filter(i => i.item_type === "EQUIPMENT").map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </Field>
        </div>
        <AddBtn onClick={addEq} label="Add Equipment" />
      </div>

      {/* Safety */}
      <h3 style={{ margin: "1.5rem 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>Safety Measures</h3>
      <div style={card}>
        <p style={{ margin: "0 0 8px", fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>PPE Used</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "1rem" }}>
          {PPE_OPTIONS.map(p => (
            <button key={p} onClick={() => togglePpe(p)} style={{
              padding: "5px 12px", borderRadius: "999px", fontSize: "0.78rem",
              border: `1px solid ${safety.ppe_used.includes(p) ? "#1d4ed8" : "#e2e8f0"}`,
              background: safety.ppe_used.includes(p) ? "#eff6ff" : "#fff",
              color: safety.ppe_used.includes(p) ? "#1d4ed8" : "#6b7280",
              cursor: "pointer", fontWeight: safety.ppe_used.includes(p) ? 600 : 400,
            }}>{p}</button>
          ))}
        </div>
        <div style={{ ...row, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <Field l="Hazard Level">
            <select style={{ ...inp, cursor: "pointer" }} value={safety.hazard_level} onChange={e => setSafety(s => ({ ...s, hazard_level: e.target.value }))}>
              {["LOW","MEDIUM","HIGH","EXTREME"].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field l="Biosafety Level">
            <select style={{ ...inp, cursor: "pointer" }} value={safety.biosafety_level || ""} onChange={e => setSafety(s => ({ ...s, biosafety_level: e.target.value || null }))}>
              <option value="">None</option>
              {["BSL1","BSL2","BSL3","BSL4"].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field l="Fume Hood">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <input type="checkbox" id="fume_hood" checked={safety.fume_hood_used} onChange={e => setSafety(s => ({ ...s, fume_hood_used: e.target.checked }))} style={{ width: "16px", height: "16px" }} />
              <label htmlFor="fume_hood" style={{ fontSize: "0.82rem", color: "#374151" }}>Fume hood used</label>
            </div>
          </Field>
        </div>
        <Field l="Other Precautions">
          <textarea style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={safety.other_precautions || ""}
            onChange={e => setSafety(s => ({ ...s, other_precautions: e.target.value }))} />
        </Field>
        <button onClick={saveSafety} disabled={saving} style={{
          background: "#2563eb", color: "#fff", border: "none", borderRadius: "7px",
          padding: "7px 16px", fontSize: "0.8rem", fontWeight: 600, cursor: saving ? "default" : "pointer", marginTop: "0.5rem",
        }}>
          {saving ? "Saving…" : "Save Safety Record"}
        </button>
      </div>
    </div>
  )
}

// ── Tab: Procedure ────────────────────────────────────────────────────
function ProcedureTab({ expId, data, onReload }) {
  const [form, setForm] = useState({ description: "", conditions: {}, is_deviation: false, deviation_note: "" })
  const [condKey, setCondKey] = useState("")
  const [condVal, setCondVal] = useState("")
  const steps = [...(data.experiment_procedure_steps || [])].sort((a, b) => a.step_number - b.step_number)

  const addCond = () => {
    if (!condKey.trim()) return
    setForm(f => ({ ...f, conditions: { ...f.conditions, [condKey.trim()]: condVal } }))
    setCondKey(""); setCondVal("")
  }

  const addS = async () => {
    if (!form.description.trim()) return alert("Step description is required")
    try {
      await addStep(expId, form)
      setForm({ description: "", conditions: {}, is_deviation: false, deviation_note: "" })
      onReload()
    } catch (e) { alert(e.response?.data?.error || "Failed to add step") }
  }

  const removeS = async (sid) => { try { await deleteStep(expId, sid); onReload() } catch (e) { alert(e.response?.data?.error || "Failed") } }

  return (
    <div>
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>Procedure Steps</h3>
      {steps.map((s, i) => (
        <div key={s.id} style={{ ...card, display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%", background: "#2563eb", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
          }}>{s.step_number}</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#0f172a" }}>{s.description}</p>
            {Object.keys(s.conditions || {}).length > 0 && (
              <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {Object.entries(s.conditions).map(([k, v]) => (
                  <span key={k} style={{ padding: "2px 8px", background: "#f1f5f9", borderRadius: "6px", fontSize: "0.72rem", color: "#475569" }}>
                    {k}: {v}
                  </span>
                ))}
              </div>
            )}
            {s.is_deviation && (
              <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#854d0e", background: "#fefce8", padding: "4px 8px", borderRadius: "6px" }}>
                Deviation: {s.deviation_note}
              </p>
            )}
          </div>
          <RemoveBtn onClick={() => removeS(s.id)} />
        </div>
      ))}
      <div style={card}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Add Step</p>
        <Field l="Description *">
          <textarea style={{ ...inp, minHeight: "80px", resize: "vertical" }} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what to do in this step..." />
        </Field>
        <div style={{ marginTop: "0.75rem" }}>
          <p style={{ ...label, marginBottom: "6px" }}>Conditions (optional)</p>
          <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
            <input style={{ ...inp, width: "auto", flex: 1 }} placeholder="Parameter (e.g. Temperature)" value={condKey} onChange={e => setCondKey(e.target.value)} />
            <input style={{ ...inp, width: "auto", flex: 1 }} placeholder="Value (e.g. 25°C)" value={condVal} onChange={e => setCondVal(e.target.value)} />
            <button onClick={addCond} style={{ padding: "7px 12px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "7px", fontSize: "0.78rem", cursor: "pointer" }}>Add</button>
          </div>
          {Object.keys(form.conditions).length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {Object.entries(form.conditions).map(([k, v]) => (
                <span key={k} onClick={() => setForm(f => { const c = {...f.conditions}; delete c[k]; return {...f, conditions: c} })}
                  style={{ padding: "2px 8px", background: "#dbeafe", borderRadius: "6px", fontSize: "0.72rem", color: "#1d4ed8", cursor: "pointer" }}
                  title="Click to remove">
                  {k}: {v} ✕
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <input type="checkbox" id="is_dev" checked={form.is_deviation} onChange={e => setForm(f => ({ ...f, is_deviation: e.target.checked }))} style={{ width: "16px", height: "16px" }} />
          <label htmlFor="is_dev" style={{ fontSize: "0.82rem", color: "#374151" }}>This step is a deviation from the protocol</label>
        </div>
        {form.is_deviation && (
          <div style={{ marginTop: "0.5rem" }}>
            <Field l="Deviation Note">
              <input style={inp} value={form.deviation_note} onChange={e => setForm(f => ({ ...f, deviation_note: e.target.value }))} placeholder="Explain what changed and why" />
            </Field>
          </div>
        )}
        <AddBtn onClick={addS} label="Add Step" />
      </div>

      {/* Controls */}
      <h3 style={{ margin: "1.5rem 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>Controls & Standards</h3>
      <ControlsSection expId={expId} data={data} onReload={onReload} />
    </div>
  )
}

function ControlsSection({ expId, data, onReload }) {
  const [form, setForm] = useState({ control_type: "POSITIVE", description: "", expected_value: "", actual_value: "", unit: "" })
  const add = async () => {
    if (!form.description.trim()) return alert("Description is required")
    try { await addControl(expId, form); setForm({ control_type: "POSITIVE", description: "", expected_value: "", actual_value: "", unit: "" }); onReload() }
    catch (e) { alert(e.response?.data?.error || "Failed") }
  }
  const remove = async (cid) => { try { await deleteControl(expId, cid); onReload() } catch (e) { alert(e.response?.data?.error || "Failed") } }

  return (
    <>
      {(data.experiment_controls || []).map(c => (
        <div key={c.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>
              <span style={{ padding: "2px 8px", borderRadius: "6px", background: "#f1f5f9", fontSize: "0.72rem", marginRight: "8px" }}>{c.control_type}</span>
              {c.description}
            </p>
            {c.expected_value && <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#64748b" }}>Expected: {c.expected_value}{c.unit ? ` ${c.unit}` : ""} · Actual: {c.actual_value || "—"}</p>}
          </div>
          <RemoveBtn onClick={() => remove(c.id)} />
        </div>
      ))}
      <div style={card}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Add Control</p>
        <div style={{ ...row, gridTemplateColumns: "1fr 2fr" }}>
          <Field l="Type">
            <select style={{ ...inp, cursor: "pointer" }} value={form.control_type} onChange={e => setForm(f => ({ ...f, control_type: e.target.value }))}>
              {["POSITIVE","NEGATIVE","BLANK","STANDARD"].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field l="Description *"><input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
        </div>
        <div style={{ ...row, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <Field l="Expected Value"><input style={inp} value={form.expected_value} onChange={e => setForm(f => ({ ...f, expected_value: e.target.value }))} /></Field>
          <Field l="Actual Value"><input style={inp} value={form.actual_value} onChange={e => setForm(f => ({ ...f, actual_value: e.target.value }))} /></Field>
          <Field l="Unit"><input style={inp} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></Field>
        </div>
        <AddBtn onClick={add} label="Add Control" />
      </div>
    </>
  )
}

// ── Tab: Data ─────────────────────────────────────────────────────────
function DataTab({ expId, data, onReload }) {
  const [form, setForm] = useState({ observation_type: "QUANTITATIVE", label: "", value: "", unit: "", replicate_number: "", notes: "" })
  const add = async () => {
    if (!form.label.trim()) return alert("Label is required")
    try { await addObservation(expId, form); setForm({ observation_type: "QUANTITATIVE", label: "", value: "", unit: "", replicate_number: "", notes: "" }); onReload() }
    catch (e) { alert(e.response?.data?.error || "Failed") }
  }
  const remove = async (oid) => { try { await deleteObservation(expId, oid); onReload() } catch (e) { alert(e.response?.data?.error || "Failed") } }

  return (
    <div>
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>Observations & Measurements</h3>
      {(data.experiment_observations || []).length === 0 && (
        <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: "0 0 1rem" }}>No observations recorded yet.</p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
        {(data.experiment_observations || []).map(o => (
          <div key={o.id} style={{ ...card, margin: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ padding: "2px 8px", borderRadius: "6px", background: "#f1f5f9", fontSize: "0.7rem", color: "#475569" }}>{o.observation_type}</span>
              <RemoveBtn onClick={() => remove(o.id)} />
            </div>
            <p style={{ margin: "6px 0 2px", fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>{o.label}</p>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#374151" }}>
              {o.value || "—"}{o.unit ? ` ${o.unit}` : ""}{o.replicate_number ? ` (Rep ${o.replicate_number})` : ""}
            </p>
            {o.notes && <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748b" }}>{o.notes}</p>}
          </div>
        ))}
      </div>
      <div style={card}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Add Observation</p>
        <div style={{ ...row, gridTemplateColumns: "1fr 2fr" }}>
          <Field l="Type">
            <select style={{ ...inp, cursor: "pointer" }} value={form.observation_type} onChange={e => setForm(f => ({ ...f, observation_type: e.target.value }))}>
              {["QUANTITATIVE","QUALITATIVE","IMAGE","SPECTRUM"].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field l="Label *"><input style={inp} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Absorbance at 540nm — Rep 1" /></Field>
        </div>
        <div style={{ ...row, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          <Field l="Value"><input style={inp} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></Field>
          <Field l="Unit"><input style={inp} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></Field>
          <Field l="Replicate #"><input style={inp} type="number" value={form.replicate_number} onChange={e => setForm(f => ({ ...f, replicate_number: e.target.value }))} /></Field>
        </div>
        <Field l="Notes"><input style={inp} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Field>
        <AddBtn onClick={add} label="Add Observation" />
      </div>
    </div>
  )
}

// ── Tab: Results ──────────────────────────────────────────────────────
function ResultsTab({ expId, data, onReload }) {
  const [form, setForm] = useState({ label: "", result_type: "CALCULATED", value: "", unit: "", expected_value: "", deviation_percent: "", uncertainty: "", method: "", notes: "" })
  const add = async () => {
    if (!form.label.trim()) return alert("Label is required")
    try { await addResult(expId, form); setForm({ label: "", result_type: "CALCULATED", value: "", unit: "", expected_value: "", deviation_percent: "", uncertainty: "", method: "", notes: "" }); onReload() }
    catch (e) { alert(e.response?.data?.error || "Failed") }
  }
  const remove = async (rid) => { try { await deleteResult(expId, rid); onReload() } catch (e) { alert(e.response?.data?.error || "Failed") } }

  return (
    <div>
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>Processed Results</h3>
      {(data.experiment_results || []).map(r => (
        <div key={r.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>{r.label}</span>
              <span style={{ padding: "1px 7px", borderRadius: "6px", background: "#f1f5f9", fontSize: "0.7rem", color: "#475569" }}>{r.result_type}</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#374151" }}>
              Value: <strong>{r.value ?? "—"}{r.unit ? ` ${r.unit}` : ""}</strong>
              {r.expected_value !== null && r.expected_value !== undefined ? ` · Expected: ${r.expected_value}${r.unit ? ` ${r.unit}` : ""}` : ""}
              {r.deviation_percent !== null && r.deviation_percent !== undefined ? ` · Deviation: ${r.deviation_percent}%` : ""}
              {r.uncertainty !== null && r.uncertainty !== undefined ? ` · ±${r.uncertainty}` : ""}
            </p>
            {r.method && <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748b" }}>Method: {r.method}</p>}
          </div>
          <RemoveBtn onClick={() => remove(r.id)} />
        </div>
      ))}
      <div style={card}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Add Result</p>
        <div style={{ ...row, gridTemplateColumns: "2fr 1fr" }}>
          <Field l="Label *"><input style={inp} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Average yield" /></Field>
          <Field l="Type">
            <select style={{ ...inp, cursor: "pointer" }} value={form.result_type} onChange={e => setForm(f => ({ ...f, result_type: e.target.value }))}>
              {["CALCULATED","YIELD","CONCENTRATION","STATISTICAL"].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ ...row, gridTemplateColumns: "repeat(5, 1fr)" }}>
          <Field l="Value"><input style={inp} type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></Field>
          <Field l="Unit"><input style={inp} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></Field>
          <Field l="Expected"><input style={inp} type="number" value={form.expected_value} onChange={e => setForm(f => ({ ...f, expected_value: e.target.value }))} /></Field>
          <Field l="Deviation %"><input style={inp} type="number" value={form.deviation_percent} onChange={e => setForm(f => ({ ...f, deviation_percent: e.target.value }))} /></Field>
          <Field l="Uncertainty ±"><input style={inp} type="number" value={form.uncertainty} onChange={e => setForm(f => ({ ...f, uncertainty: e.target.value }))} /></Field>
        </div>
        <Field l="Calculation Method"><input style={inp} value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} /></Field>
        <AddBtn onClick={add} label="Add Result" />
      </div>
    </div>
  )
}

// ── Tab: Conclusions ──────────────────────────────────────────────────
function ConclusionsTab({ expId, data, onReload }) {
  const existing = data.experiment_conclusions?.[0] || {}
  const [form, setForm] = useState({
    key_findings: existing.key_findings || "",
    error_sources: existing.error_sources || "",
    limitations: existing.limitations || "",
    improvement_suggestions: existing.improvement_suggestions || "",
    follow_up_experiments: existing.follow_up_experiments || "",
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try { await upsertConclusions(expId, form); onReload() }
    catch (e) { alert(e.response?.data?.error || "Save failed") }
    finally { setSaving(false) }
  }

  const ta = { ...inp, minHeight: "100px", resize: "vertical" }
  return (
    <div>
      <div style={{ display: "grid", gap: "1rem" }}>
        <Field l="Key Findings & Interpretation"><textarea style={ta} value={form.key_findings} onChange={e => setForm(f => ({ ...f, key_findings: e.target.value }))} /></Field>
        <Field l="Sources of Error"><textarea style={ta} value={form.error_sources} onChange={e => setForm(f => ({ ...f, error_sources: e.target.value }))} /></Field>
        <Field l="Limitations"><textarea style={ta} value={form.limitations} onChange={e => setForm(f => ({ ...f, limitations: e.target.value }))} /></Field>
        <Field l="Suggestions for Improvement"><textarea style={ta} value={form.improvement_suggestions} onChange={e => setForm(f => ({ ...f, improvement_suggestions: e.target.value }))} /></Field>
        <Field l="Follow-up Experiments"><textarea style={ta} value={form.follow_up_experiments} onChange={e => setForm(f => ({ ...f, follow_up_experiments: e.target.value }))} /></Field>
      </div>
      <button onClick={save} disabled={saving} style={{
        background: "#2563eb", color: "#fff", border: "none", borderRadius: "7px",
        padding: "9px 20px", fontSize: "0.82rem", fontWeight: 600, cursor: saving ? "default" : "pointer", marginTop: "1rem",
      }}>
        {saving ? "Saving…" : "Save Conclusions"}
      </button>
    </div>
  )
}

// ── Tab: Compliance ───────────────────────────────────────────────────
function ComplianceTab({ expId, data, onReload }) {
  const [wasteForm, setWasteForm] = useState({ waste_description: "", waste_type: "NON_HAZARDOUS", quantity: "", unit: "", disposal_method: "", disposal_date: "" })
  const [apprForm, setApprForm]   = useState({ approval_type: "ETHICS", approval_number: "", approving_body: "", approval_date: "", expiry_date: "" })

  const addWaste = async () => {
    if (!wasteForm.waste_description.trim()) return alert("Waste description is required")
    try { await addWasteRecord(expId, wasteForm); setWasteForm({ waste_description: "", waste_type: "NON_HAZARDOUS", quantity: "", unit: "", disposal_method: "", disposal_date: "" }); onReload() }
    catch (e) { alert(e.response?.data?.error || "Failed") }
  }
  const removeWaste = async (wid) => { try { await deleteWasteRecord(expId, wid); onReload() } catch (e) { alert(e.response?.data?.error || "Failed") } }

  const addAppr = async () => {
    if (!apprForm.approval_type) return alert("Approval type is required")
    try { await addEthicalApproval(expId, apprForm); setApprForm({ approval_type: "ETHICS", approval_number: "", approving_body: "", approval_date: "", expiry_date: "" }); onReload() }
    catch (e) { alert(e.response?.data?.error || "Failed") }
  }
  const removeAppr = async (apid) => { try { await deleteEthicalApproval(expId, apid); onReload() } catch (e) { alert(e.response?.data?.error || "Failed") } }

  const WASTE_COLORS = { NON_HAZARDOUS: "#15803d", HAZARDOUS: "#dc2626", BIOLOGICAL: "#7c3aed", RADIOACTIVE: "#d97706", SHARPS: "#64748b" }

  return (
    <div>
      {/* Waste */}
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>Waste Disposal Records</h3>
      {(data.experiment_waste_records || []).map(w => (
        <div key={w.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>{w.waste_description}</p>
            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: WASTE_COLORS[w.waste_type] || "#64748b" }}>
              {w.waste_type}{w.quantity ? ` · ${w.quantity} ${w.unit || ""}` : ""}{w.disposal_method ? ` · ${w.disposal_method}` : ""}{w.disposal_date ? ` · ${w.disposal_date}` : ""}
            </p>
          </div>
          <RemoveBtn onClick={() => removeWaste(w.id)} />
        </div>
      ))}
      <div style={card}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Add Waste Record</p>
        <div style={{ ...row, gridTemplateColumns: "2fr 1fr" }}>
          <Field l="Waste Description *"><input style={inp} value={wasteForm.waste_description} onChange={e => setWasteForm(f => ({ ...f, waste_description: e.target.value }))} /></Field>
          <Field l="Type">
            <select style={{ ...inp, cursor: "pointer" }} value={wasteForm.waste_type} onChange={e => setWasteForm(f => ({ ...f, waste_type: e.target.value }))}>
              {["NON_HAZARDOUS","HAZARDOUS","BIOLOGICAL","RADIOACTIVE","SHARPS"].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ ...row, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          <Field l="Quantity"><input style={inp} type="number" value={wasteForm.quantity} onChange={e => setWasteForm(f => ({ ...f, quantity: e.target.value }))} /></Field>
          <Field l="Unit"><input style={inp} value={wasteForm.unit} onChange={e => setWasteForm(f => ({ ...f, unit: e.target.value }))} /></Field>
          <Field l="Disposal Method"><input style={inp} value={wasteForm.disposal_method} onChange={e => setWasteForm(f => ({ ...f, disposal_method: e.target.value }))} /></Field>
          <Field l="Disposal Date"><input type="date" style={inp} value={wasteForm.disposal_date} onChange={e => setWasteForm(f => ({ ...f, disposal_date: e.target.value }))} /></Field>
        </div>
        <AddBtn onClick={addWaste} label="Add Waste Record" />
      </div>

      {/* Approvals */}
      <h3 style={{ margin: "1.5rem 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>Ethical & Compliance Approvals</h3>
      {(data.experiment_ethical_approvals || []).map(a => (
        <div key={a.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>
              {a.approval_type}{a.approval_number ? ` — ${a.approval_number}` : ""}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#64748b" }}>
              {a.approving_body}{a.approval_date ? ` · Approved: ${a.approval_date}` : ""}{a.expiry_date ? ` · Expires: ${a.expiry_date}` : ""}
            </p>
          </div>
          <RemoveBtn onClick={() => removeAppr(a.id)} />
        </div>
      ))}
      <div style={card}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Add Approval</p>
        <div style={{ ...row, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <Field l="Type">
            <select style={{ ...inp, cursor: "pointer" }} value={apprForm.approval_type} onChange={e => setApprForm(f => ({ ...f, approval_type: e.target.value }))}>
              {["ETHICS","BIOSAFETY","CHEMICAL","RADIATION"].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field l="Approval Number"><input style={inp} value={apprForm.approval_number} onChange={e => setApprForm(f => ({ ...f, approval_number: e.target.value }))} /></Field>
          <Field l="Approving Body"><input style={inp} value={apprForm.approving_body} onChange={e => setApprForm(f => ({ ...f, approving_body: e.target.value }))} /></Field>
        </div>
        <div style={{ ...row, gridTemplateColumns: "1fr 1fr" }}>
          <Field l="Approval Date"><input type="date" style={inp} value={apprForm.approval_date} onChange={e => setApprForm(f => ({ ...f, approval_date: e.target.value }))} /></Field>
          <Field l="Expiry Date"><input type="date" style={inp} value={apprForm.expiry_date} onChange={e => setApprForm(f => ({ ...f, expiry_date: e.target.value }))} /></Field>
        </div>
        <AddBtn onClick={addAppr} label="Add Approval" />
      </div>
    </div>
  )
}

// ── Main ExperimentEditor ─────────────────────────────────────────────
export default function ExperimentEditor() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const isNew     = !id
  const { isAdmin, requiresLabSelection, role } = useAuth()
  const isManager = ["LAB_MANAGER", "SUPER_ADMIN", "ADMIN"].includes(role)

  const [activeTab, setActiveTab] = useState("admin")
  const [expData,   setExpData]   = useState(null)
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(!isNew)
  const [saving,    setSaving]    = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState(null)

  const [adminForm, setAdminForm] = useState({
    title: "", objective: "", course_module: "",
    session_date: new Date().toISOString().slice(0, 10),
    session_start: "", session_end: "", protocol_reference: "",
  })

  const onAdminChange = (key, val) => setAdminForm(f => ({ ...f, [key]: val }))

  const reload = useCallback(async () => {
    if (!id) return
    try {
      const data = await fetchExperimentById(id)
      setExpData(data)
      setAdminForm({
        title:              data.title || "",
        objective:          data.objective || "",
        course_module:      data.course_module || "",
        session_date:       data.session_date || new Date().toISOString().slice(0, 10),
        session_start:      data.session_start ? data.session_start.slice(11, 16) : "",
        session_end:        data.session_end   ? data.session_end.slice(11, 16)   : "",
        protocol_reference: data.protocol_reference || "",
      })
    } catch { setError("Failed to load experiment") }
  }, [id])

  useEffect(() => {
    Promise.all([
      id ? fetchExperimentById(id) : Promise.resolve(null),
      fetchItems(),
    ]).then(([expResult, itemResult]) => {
      if (expResult) {
        setExpData(expResult)
        setAdminForm({
          title:              expResult.title || "",
          objective:          expResult.objective || "",
          course_module:      expResult.course_module || "",
          session_date:       expResult.session_date || new Date().toISOString().slice(0, 10),
          session_start:      expResult.session_start ? expResult.session_start.slice(11, 16) : "",
          session_end:        expResult.session_end   ? expResult.session_end.slice(11, 16)   : "",
          protocol_reference: expResult.protocol_reference || "",
        })
      }
      setItems(Array.isArray(itemResult) ? itemResult : [])
    }).catch(() => setError("Failed to load data")).finally(() => setLoading(false))
  }, [id])

  const handleSaveAdmin = async () => {
    if (!adminForm.title.trim()) return alert("Title is required")
    if (!adminForm.session_date)  return alert("Session date is required")
    setSaving(true)
    setError(null)
    try {
      if (isNew) {
        const created = await createExperiment(adminForm)
        navigate(`/experiments/${created.id}/edit`, { replace: true })
      } else {
        await updateExperiment(id, adminForm)
        await reload()
      }
    } catch (e) {
      setError(e.response?.data?.error || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!window.confirm("Submit this experiment for supervisor review? You won't be able to edit it after submission.")) return
    setSubmitting(true)
    try {
      await submitExperiment(id)
      navigate(`/experiments/${id}`)
    } catch (e) {
      alert(e.response?.data?.error || "Submit failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Loading…</div>
  }

  // SUPER_ADMIN must select a laboratory before creating or editing experiments
  if (isAdmin && requiresLabSelection && isNew) {
    return (
      <div style={{ maxWidth: "600px" }}>
        <button onClick={() => navigate("/experiments")} style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.82rem", cursor: "pointer", padding: "0 0 1rem" }}>
          ← Back to Experiments
        </button>
        <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: "10px", padding: "1.5rem" }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "0.9rem", color: "#854d0e" }}>No laboratory selected</p>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#92400e" }}>
            Select a laboratory from the sidebar before creating an experiment.
          </p>
        </div>
      </div>
    )
  }

  const canSubmit = expData && ["DRAFT", "IN_PROGRESS"].includes(expData.status)
  const expId     = expData?.id || id

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <button onClick={() => navigate("/experiments")} style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.82rem", cursor: "pointer", padding: 0, marginBottom: "4px" }}>
            ← Back to Experiments
          </button>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
            {isNew ? "New Experiment" : (expData?.title || "Edit Experiment")}
          </h1>
          {expData && (
            <span style={{
              display: "inline-block", marginTop: "4px", padding: "2px 10px", borderRadius: "999px",
              fontSize: "0.7rem", fontWeight: 600, background: "#eff6ff", color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}>{expData.status.replace("_", " ")}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {activeTab === "admin" && (
            <button onClick={handleSaveAdmin} disabled={saving} style={{
              background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px",
              padding: "9px 18px", fontSize: "0.82rem", fontWeight: 600, cursor: saving ? "default" : "pointer",
            }}>
              {saving ? "Saving…" : isNew ? "Create & Continue" : "Save Changes"}
            </button>
          )}
          {!isNew && canSubmit && (
            <button onClick={handleSubmit} disabled={submitting} style={{
              background: "#059669", color: "#fff", border: "none", borderRadius: "8px",
              padding: "9px 18px", fontSize: "0.82rem", fontWeight: 600, cursor: submitting ? "default" : "pointer",
            }}>
              {submitting ? "Submitting…" : isManager ? "Submit & Review" : "Submit for Review"}
            </button>
          )}
          {!isNew && isManager && expData?.status === "SUBMITTED" && (
            <button onClick={() => navigate(`/experiments/${id}`)} style={{
              background: "#7c3aed", color: "#fff", border: "none", borderRadius: "8px",
              padding: "9px 18px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
            }}>
              Approve / Reject
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px", padding: "10px 14px", fontSize: "0.82rem", color: "#be123c", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "1.25rem", background: "#f1f5f9", borderRadius: "10px", padding: "4px", overflowX: "auto" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            disabled={isNew && t.id !== "admin"}
            style={{
              flex: 1, minWidth: "90px", padding: "7px 4px", border: "none", borderRadius: "7px",
              fontSize: "0.75rem", fontWeight: activeTab === t.id ? 700 : 400,
              background: activeTab === t.id ? "#fff" : "transparent",
              color: isNew && t.id !== "admin" ? "#cbd5e1" : activeTab === t.id ? "#0f172a" : "#64748b",
              cursor: isNew && t.id !== "admin" ? "default" : "pointer",
              boxShadow: activeTab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
        {activeTab === "admin"       && <AdminTab       form={adminForm} onChange={onAdminChange} saving={saving} />}
        {activeTab === "setup"       && expData && <SetupTab       expId={expId} data={expData} onReload={reload} items={items} />}
        {activeTab === "procedure"   && expData && <ProcedureTab   expId={expId} data={expData} onReload={reload} />}
        {activeTab === "data"        && expData && <DataTab        expId={expId} data={expData} onReload={reload} />}
        {activeTab === "results"     && expData && <ResultsTab     expId={expId} data={expData} onReload={reload} />}
        {activeTab === "conclusions" && expData && <ConclusionsTab expId={expId} data={expData} onReload={reload} />}
        {activeTab === "compliance"  && expData && <ComplianceTab  expId={expId} data={expData} onReload={reload} />}
        {!isNew && !expData && activeTab !== "admin" && (
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Save the experiment first to unlock this section.</p>
        )}
      </div>
    </div>
  )
}
