import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  createExperiment,
  addMaterial, deleteMaterial,
  addEquipment, deleteEquipment,
  submitExperiment,
} from "../services/experimentsApi"
import { fetchItems } from "../services/itemsApi"

// ── Shared styles ──────────────────────────────────────────────────────
const inp = {
  width: "100%", border: "1px solid #e2e8f0", borderRadius: "8px",
  padding: "10px 12px", fontSize: "0.85rem", color: "#0f172a",
  outline: "none", boxSizing: "border-box", background: "#fff",
}
const lbl = { display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }
const card = {
  background: "#fff", borderRadius: "12px", padding: "1.5rem",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
}

function Field({ label, children, required }) {
  return (
    <div>
      <span style={lbl}>{label}{required && <span style={{ color: "#dc2626" }}> *</span>}</span>
      {children}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    DRAFT:       { bg: "#f1f5f9", color: "#64748b", label: "Draft" },
    IN_PROGRESS: { bg: "#eff6ff", color: "#2563eb", label: "In Progress" },
    SUBMITTED:   { bg: "#fef3c7", color: "#d97706", label: "Submitted" },
    APPROVED:    { bg: "#dcfce7", color: "#16a34a", label: "Approved" },
    REJECTED:    { bg: "#fee2e2", color: "#dc2626", label: "Rejected" },
  }
  const s = map[status] || map.DRAFT
  return (
    <span style={{
      background: s.bg, color: s.color, borderRadius: "6px",
      padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600,
    }}>
      {s.label}
    </span>
  )
}

const STEP_LABELS = ["Report Details", "Materials & Equipment Used", "Review & Submit"]

export default function ExperimentWizard() {
  const navigate = useNavigate()

  const [step,    setStep]    = useState(1)
  const [expId,   setExpId]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // ── Step 1 form ────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: "", course_module: "", objective: "", session_date: "",
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Step 2 – catalog items ─────────────────────────────────────────
  const [catalogItems,   setCatalogItems]   = useState([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [itemSearch,     setItemSearch]     = useState("")

  // Materials added to this experiment
  const [materials, setMaterials] = useState([])
  // Which catalog item is being configured right now
  const [addingItem, setAddingItem] = useState(null)
  const [matQty,     setMatQty]     = useState("")
  const [matUnit,    setMatUnit]    = useState("")
  const [matAdding,  setMatAdding]  = useState(false)

  // Custom material form
  const [customOpen, setCustomOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customQty,  setCustomQty]  = useState("")
  const [customUnit, setCustomUnit] = useState("")

  // Equipment list (simple text entries)
  const [equipment, setEquipment] = useState([])
  const [eqName,    setEqName]    = useState("")
  const [eqAdding,  setEqAdding]  = useState(false)

  useEffect(() => {
    setCatalogLoading(true)
    fetchItems()
      .then(d => setCatalogItems(Array.isArray(d) ? d : []))
      .catch(() => setCatalogItems([]))
      .finally(() => setCatalogLoading(false))
  }, [])

  // ── Step 1 → 2: create DRAFT experiment ───────────────────────────
  const handleStep1 = async () => {
    if (!form.title.trim())  { setError("Experiment title is required"); return }
    if (!form.session_date)  { setError("Planned session date is required"); return }
    setError(null)
    setLoading(true)
    try {
      const result = await createExperiment({
        title:         form.title.trim(),
        course_module: form.course_module.trim() || undefined,
        objective:     form.objective.trim()     || undefined,
        session_date:  form.session_date,
      })
      setExpId(result.id)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create experiment draft")
    } finally {
      setLoading(false)
    }
  }

  // ── Add material from catalog ──────────────────────────────────────
  const handleAddCatalogMaterial = async () => {
    if (!addingItem) return
    const qty = parseFloat(matQty)
    if (!qty || qty <= 0) { setError("Enter a valid quantity"); return }
    if (!matUnit.trim())  { setError("Unit is required"); return }
    setError(null)
    setMatAdding(true)
    try {
      const result = await addMaterial(expId, {
        item_id:       addingItem.id,
        material_name: addingItem.name,
        quantity_used: qty,
        unit:          matUnit.trim(),
      })
      setMaterials(prev => [...prev, result])
      setAddingItem(null)
      setMatQty("")
      setMatUnit("")
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add material")
    } finally {
      setMatAdding(false)
    }
  }

  // ── Add custom material ────────────────────────────────────────────
  const handleAddCustomMaterial = async () => {
    if (!customName.trim()) { setError("Material name is required"); return }
    const qty = parseFloat(customQty)
    if (!qty || qty <= 0)   { setError("Enter a valid quantity"); return }
    if (!customUnit.trim()) { setError("Unit is required"); return }
    setError(null)
    setMatAdding(true)
    try {
      const result = await addMaterial(expId, {
        material_name: customName.trim(),
        quantity_used: qty,
        unit:          customUnit.trim(),
      })
      setMaterials(prev => [...prev, result])
      setCustomName("")
      setCustomQty("")
      setCustomUnit("")
      setCustomOpen(false)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add material")
    } finally {
      setMatAdding(false)
    }
  }

  // ── Remove material ────────────────────────────────────────────────
  const handleRemoveMaterial = async (mid) => {
    try {
      await deleteMaterial(expId, mid)
      setMaterials(prev => prev.filter(m => m.id !== mid))
    } catch {
      setError("Failed to remove material")
    }
  }

  // ── Add equipment (name-only entry) ───────────────────────────────
  const handleAddEquipment = async () => {
    if (!eqName.trim()) { setError("Equipment name is required"); return }
    setError(null)
    setEqAdding(true)
    try {
      const result = await addEquipment(expId, {
        equipment_name: eqName.trim(),
        calibration_status: "N/A",
      })
      setEquipment(prev => [...prev, result])
      setEqName("")
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add equipment")
    } finally {
      setEqAdding(false)
    }
  }

  const handleRemoveEquipment = async (eid) => {
    try {
      await deleteEquipment(expId, eid)
      setEquipment(prev => prev.filter(e => e.id !== eid))
    } catch {
      setError("Failed to remove equipment")
    }
  }

  // ── Step 3: submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await submitExperiment(expId)
      navigate(`/experiments/${expId}`)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit experiment")
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = catalogItems.filter(item =>
    !itemSearch ||
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    (item.sku || "").toLowerCase().includes(itemSearch.toLowerCase())
  )

  // Already-added item IDs (to disable re-adding)
  const addedItemIds = new Set(materials.filter(m => m.item_id).map(m => m.item_id))

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "1.3rem", fontWeight: 700, color: "#0f172a" }}>
          Submit Experiment Report
        </h1>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
          Submit your post-experiment report for assessment by the lab team.
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "0.5rem" }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            flex: 1, height: "4px", borderRadius: "2px",
            background: step >= s ? "#2563eb" : "#e2e8f0",
            transition: "background 0.2s",
          }} />
        ))}
      </div>
      <p style={{ margin: "0 0 1.5rem", fontSize: "0.75rem", color: "#64748b" }}>
        Step {step} of 3 — {STEP_LABELS[step - 1]}
      </p>

      {/* Error banner */}
      {error && (
        <div style={{
          background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px",
          padding: "10px 14px", fontSize: "0.82rem", color: "#be123c", marginBottom: "1rem",
        }}>
          {error}
        </div>
      )}

      {/* ── STEP 1 ──────────────────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ ...card, display: "grid", gap: "1.1rem" }}>
          <Field label="Experiment Title" required>
            <input
              style={inp} value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="e.g. Acid-Base Titration of HCl with NaOH"
              autoFocus
            />
          </Field>

          <Field label="Course / Module">
            <input
              style={inp} value={form.course_module}
              onChange={e => set("course_module", e.target.value)}
              placeholder="e.g. CHEM 301 — Analytical Chemistry"
            />
          </Field>

          <Field label="Date Performed" required>
            <input
              style={inp} type="date" value={form.session_date}
              onChange={e => set("session_date", e.target.value)}
            />
          </Field>

          <Field label="Objective / Hypothesis (as performed)">
            <textarea
              style={{ ...inp, minHeight: "90px", resize: "vertical" }}
              value={form.objective}
              onChange={e => set("objective", e.target.value)}
              placeholder="Briefly describe what you aim to investigate or prove…"
            />
          </Field>

          <button
            onClick={handleStep1}
            disabled={loading}
            style={{
              background: loading ? "#93c5fd" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff", border: "none", borderRadius: "8px",
              padding: "11px", fontSize: "0.88rem", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", marginTop: "0.25rem",
            }}
          >
            {loading ? "Saving…" : "Continue — Add Materials Used →"}
          </button>
        </div>
      )}

      {/* ── STEP 2 ──────────────────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ display: "grid", gap: "1.25rem" }}>

          {/* Materials section */}
          <div style={card}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
              📋 Materials Used
            </h3>

            {/* Added materials */}
            {materials.length > 0 && (
              <div style={{ marginBottom: "1rem", display: "grid", gap: "6px" }}>
                {materials.map(m => (
                  <div key={m.id} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: "#f8fafc", borderRadius: "8px", padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                  }}>
                    <span style={{ flex: 1, fontSize: "0.83rem", fontWeight: 500, color: "#1e293b" }}>
                      {m.material_name}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      {m.quantity_used} {m.unit}
                    </span>
                    {m.item_id && (
                      <span style={{
                        fontSize: "0.65rem", background: "#eff6ff", color: "#2563eb",
                        borderRadius: "4px", padding: "1px 6px", fontWeight: 600,
                      }}>catalog</span>
                    )}
                    <button
                      onClick={() => handleRemoveMaterial(m.id)}
                      style={{
                        background: "none", border: "none", color: "#94a3b8",
                        cursor: "pointer", padding: "2px 6px", fontSize: "0.9rem",
                      }}
                      title="Remove"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Catalog search + add */}
            <div style={{ marginBottom: "0.75rem" }}>
              <p style={{ ...lbl, marginBottom: "6px" }}>Add from Lab Inventory</p>
              <input
                style={{ ...inp, marginBottom: "8px" }}
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                placeholder="Search items by name or SKU…"
              />
              {catalogLoading
                ? <p style={{ fontSize: "0.8rem", color: "#94a3b8", textAlign: "center", padding: "12px" }}>
                    Loading inventory…
                  </p>
                : (
                  <div style={{
                    maxHeight: "220px", overflowY: "auto",
                    border: "1px solid #e2e8f0", borderRadius: "8px",
                  }}>
                    {filteredItems.length === 0
                      ? <p style={{ padding: "12px", fontSize: "0.8rem", color: "#94a3b8", textAlign: "center", margin: 0 }}>
                          No items found
                        </p>
                      : filteredItems.map(item => {
                          const alreadyAdded = addedItemIds.has(item.id)
                          const isThis = addingItem?.id === item.id
                          return (
                            <div key={item.id} style={{
                              borderBottom: "1px solid #f1f5f9",
                              padding: isThis ? "10px 12px" : "8px 12px",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 500, color: "#1e293b" }}>
                                    {item.name}
                                  </p>
                                  <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8" }}>
                                    {item.sku && `SKU: ${item.sku}`}
                                    {item.categories?.name && ` · ${item.categories.name}`}
                                    {item.unit_of_measure && ` · ${item.unit_of_measure}`}
                                  </p>
                                </div>
                                {!alreadyAdded && !isThis && (
                                  <button
                                    onClick={() => {
                                      setAddingItem(item)
                                      setMatUnit(item.unit_of_measure || "")
                                      setMatQty("")
                                      setError(null)
                                    }}
                                    style={{
                                      background: "#eff6ff", color: "#2563eb",
                                      border: "1px solid #bfdbfe", borderRadius: "6px",
                                      padding: "5px 10px", fontSize: "0.75rem",
                                      fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                                    }}
                                  >
                                    + Add
                                  </button>
                                )}
                                {alreadyAdded && (
                                  <span style={{
                                    fontSize: "0.72rem", color: "#16a34a",
                                    fontWeight: 600,
                                  }}>✓ Added</span>
                                )}
                              </div>

                              {/* Inline qty/unit form */}
                              {isThis && (
                                <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                  <input
                                    style={{ ...inp, width: "100px" }}
                                    type="number" min="0.001" step="any"
                                    value={matQty}
                                    onChange={e => setMatQty(e.target.value)}
                                    placeholder="Qty"
                                    autoFocus
                                  />
                                  <input
                                    style={{ ...inp, flex: 1, minWidth: "80px" }}
                                    value={matUnit}
                                    onChange={e => setMatUnit(e.target.value)}
                                    placeholder="Unit (e.g. mL, g)"
                                  />
                                  <button
                                    onClick={handleAddCatalogMaterial}
                                    disabled={matAdding}
                                    style={{
                                      background: "#16a34a", color: "#fff",
                                      border: "none", borderRadius: "6px",
                                      padding: "6px 14px", fontSize: "0.8rem",
                                      fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                                    }}
                                  >
                                    {matAdding ? "…" : "Confirm"}
                                  </button>
                                  <button
                                    onClick={() => { setAddingItem(null); setError(null) }}
                                    style={{
                                      background: "#f1f5f9", color: "#64748b",
                                      border: "1px solid #e2e8f0", borderRadius: "6px",
                                      padding: "6px 10px", fontSize: "0.8rem", cursor: "pointer",
                                    }}
                                  >Cancel</button>
                                </div>
                              )}
                            </div>
                          )
                        })
                    }
                  </div>
                )
              }
            </div>

            {/* Custom material */}
            {!customOpen
              ? (
                <button
                  onClick={() => { setCustomOpen(true); setError(null) }}
                  style={{
                    background: "none", border: "1px dashed #cbd5e1",
                    borderRadius: "8px", padding: "9px 14px", width: "100%",
                    fontSize: "0.8rem", color: "#64748b", cursor: "pointer",
                  }}
                >
                  + Add unlisted material
                </button>
              )
              : (
                <div style={{
                  border: "1px dashed #cbd5e1", borderRadius: "8px",
                  padding: "12px", display: "grid", gap: "8px",
                }}>
                  <p style={{ ...lbl, margin: 0 }}>Custom Material</p>
                  <input
                    style={inp} value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="Material name"
                    autoFocus
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      style={{ ...inp, width: "110px" }}
                      type="number" min="0.001" step="any"
                      value={customQty} onChange={e => setCustomQty(e.target.value)}
                      placeholder="Quantity"
                    />
                    <input
                      style={{ ...inp, flex: 1 }}
                      value={customUnit} onChange={e => setCustomUnit(e.target.value)}
                      placeholder="Unit"
                    />
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={handleAddCustomMaterial}
                      disabled={matAdding}
                      style={{
                        flex: 1, background: "#0f172a", color: "#fff", border: "none",
                        borderRadius: "6px", padding: "8px", fontSize: "0.8rem",
                        fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      {matAdding ? "Adding…" : "Add Material"}
                    </button>
                    <button
                      onClick={() => { setCustomOpen(false); setError(null) }}
                      style={{
                        background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0",
                        borderRadius: "6px", padding: "8px 14px", fontSize: "0.8rem", cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            }
          </div>

          {/* Equipment section */}
          <div style={card}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
              🔧 Equipment Used
            </h3>

            {equipment.length > 0 && (
              <div style={{ marginBottom: "0.75rem", display: "grid", gap: "6px" }}>
                {equipment.map(eq => (
                  <div key={eq.id} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: "#f8fafc", borderRadius: "8px", padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                  }}>
                    <span style={{ flex: 1, fontSize: "0.83rem", fontWeight: 500, color: "#1e293b" }}>
                      {eq.equipment_name}
                    </span>
                    <button
                      onClick={() => handleRemoveEquipment(eq.id)}
                      style={{
                        background: "none", border: "none", color: "#94a3b8",
                        cursor: "pointer", padding: "2px 6px", fontSize: "0.9rem",
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <input
                style={{ ...inp, flex: 1 }}
                value={eqName} onChange={e => setEqName(e.target.value)}
                placeholder="e.g. Burette, Analytical Balance, pH Meter"
                onKeyDown={e => e.key === "Enter" && handleAddEquipment()}
              />
              <button
                onClick={handleAddEquipment}
                disabled={eqAdding}
                style={{
                  background: "#0f172a", color: "#fff", border: "none",
                  borderRadius: "8px", padding: "10px 16px", fontSize: "0.82rem",
                  fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {eqAdding ? "…" : "+ Add"}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => { setStep(1); setError(null) }}
              style={{
                flex: 1, border: "1px solid #e2e8f0", borderRadius: "8px",
                padding: "11px", fontSize: "0.85rem", background: "#fff",
                color: "#374151", cursor: "pointer",
              }}
            >
              ← Back
            </button>
            <button
              onClick={() => { setError(null); setStep(3) }}
              style={{
                flex: 2, background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#fff", border: "none", borderRadius: "8px", padding: "11px",
                fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
              }}
            >
              Review & Submit →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ──────────────────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ display: "grid", gap: "1.25rem" }}>
          <div style={card}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
              Experiment Summary
            </h3>
            <div style={{ display: "grid", gap: "10px" }}>
              <Row label="Title"        value={form.title} />
              <Row label="Session Date" value={form.session_date} />
              {form.course_module && <Row label="Module"    value={form.course_module} />}
              {form.objective     && <Row label="Objective" value={form.objective} multiline />}
            </div>
          </div>

          {materials.length > 0 && (
            <div style={card}>
              <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>
                Materials ({materials.length})
              </h3>
              <div style={{ display: "grid", gap: "6px" }}>
                {materials.map(m => (
                  <div key={m.id} style={{
                    display: "flex", gap: "8px", justifyContent: "space-between",
                    fontSize: "0.83rem", color: "#374151",
                    borderBottom: "1px solid #f1f5f9", paddingBottom: "6px",
                  }}>
                    <span style={{ fontWeight: 500 }}>{m.material_name}</span>
                    <span style={{ color: "#64748b" }}>{m.quantity_used} {m.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {equipment.length > 0 && (
            <div style={card}>
              <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>
                Equipment ({equipment.length})
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {equipment.map(eq => (
                  <span key={eq.id} style={{
                    background: "#f1f5f9", borderRadius: "6px", padding: "4px 10px",
                    fontSize: "0.8rem", color: "#374151",
                  }}>
                    {eq.equipment_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{
            background: "#fffbeb", border: "1px solid #fde68a",
            borderRadius: "10px", padding: "12px 16px", fontSize: "0.82rem", color: "#92400e",
          }}>
            ℹ️ After submission, the lab team (manager and technician) will assess your report. You will be notified of the outcome.
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => { setStep(2); setError(null) }}
              style={{
                flex: 1, border: "1px solid #e2e8f0", borderRadius: "8px",
                padding: "11px", fontSize: "0.85rem", background: "#fff",
                color: "#374151", cursor: "pointer",
              }}
            >
              ← Back
            </button>
            <button
              onClick={() => navigate(`/experiments/${expId}`)}
              style={{
                flex: 1, border: "1px solid #e2e8f0", borderRadius: "8px",
                padding: "11px", fontSize: "0.85rem", background: "#fff",
                color: "#374151", cursor: "pointer",
              }}
            >
              Save as Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 2,
                background: loading ? "#93c5fd" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#fff", border: "none", borderRadius: "8px", padding: "11px",
                fontSize: "0.85rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Submitting…" : "Submit Report ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, multiline }) {
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: multiline ? "flex-start" : "center" }}>
      <span style={{ minWidth: "110px", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.3px" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.85rem", color: "#1e293b", lineHeight: 1.5 }}>{value}</span>
    </div>
  )
}
