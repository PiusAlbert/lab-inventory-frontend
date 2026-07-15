import { useEffect, useState, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import {
  fetchLaboratories,
  createLaboratory,
  updateLaboratory,
  toggleLaboratory,
} from "../services/laboratoriesApi"

// ── Small helpers ──────────────────────────────────────────────────────

function StatusBadge({ active }) {
  return active ? (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
      Active
    </span>
  ) : (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
      Inactive
    </span>
  )
}

const EMPTY_FORM = { name: "", location: "" }

// ── Lab form (used for both create and edit) ───────────────────────────

function LabForm({ initial = EMPTY_FORM, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Laboratory name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. MLT LAB"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Location <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Block C, Room 12"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600
                     hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim()}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {saving ? "Saving…" : "Save laboratory"}
        </button>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────

export default function Laboratories() {
  const { isAdmin } = useAuth()

  const [labs,    setLabs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // "adding" shows the create form; editId is the lab being edited
  const [adding,   setAdding]   = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [formErr,  setFormErr]  = useState(null)
  const [toggling, setToggling] = useState(null)  // labId being toggled

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setLabs(await fetchLaboratories())
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load laboratories")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (form) => {
    setSaving(true)
    setFormErr(null)
    try {
      const created = await createLaboratory(form)
      setLabs((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setAdding(false)
    } catch (err) {
      setFormErr(err.response?.data?.error || err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (form) => {
    setSaving(true)
    setFormErr(null)
    try {
      const updated = await updateLaboratory(editId, form)
      setLabs((prev) =>
        prev.map((l) => (l.id === editId ? updated : l))
            .sort((a, b) => a.name.localeCompare(b.name))
      )
      setEditId(null)
    } catch (err) {
      setFormErr(err.response?.data?.error || err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (lab) => {
    setToggling(lab.id)
    try {
      const updated = await toggleLaboratory(lab.id)
      setLabs((prev) => prev.map((l) => (l.id === lab.id ? updated : l)))
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    } finally {
      setToggling(null)
    }
  }

  // Stats
  const activeCount   = labs.filter((l) => l.is_active).length
  const inactiveCount = labs.length - activeCount

  if (!isAdmin) {
    return (
      <div className="bg-red-50 text-red-700 rounded-lg p-6 text-sm">
        Access restricted to Super Admin only.
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Laboratories</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage laboratories and their status
          </p>
        </div>
        {!adding && !editId && (
          <button
            onClick={() => { setAdding(true); setFormErr(null) }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                       bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add laboratory
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-800">{labs.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Active</p>
          <p className="text-2xl font-bold text-emerald-700">{activeCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Inactive</p>
          <p className="text-2xl font-bold text-gray-400">{inactiveCount}</p>
        </div>
      </div>

      {/* Create form */}
      {adding && (
        <div>
          {formErr && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-2">
              {formErr}
            </p>
          )}
          <LabForm
            onSave={handleCreate}
            onCancel={() => { setAdding(false); setFormErr(null) }}
            saving={saving}
          />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
          Loading laboratories…
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">{error}</div>
      ) : labs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
          No laboratories yet. Click "Add laboratory" to create one.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Location</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {labs.map((lab) => (
                  <tr key={lab.id} className="hover:bg-gray-50 transition-colors">

                    {editId === lab.id ? (
                      <td colSpan={5} className="px-4 py-3">
                        {formErr && (
                          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-2">
                            {formErr}
                          </p>
                        )}
                        <LabForm
                          initial={{ name: lab.name, location: lab.location || "" }}
                          onSave={handleUpdate}
                          onCancel={() => { setEditId(null); setFormErr(null) }}
                          saving={saving}
                        />
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-gray-800">{lab.name}</td>

                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {lab.location || <span className="text-gray-300">—</span>}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge active={lab.is_active} />
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(lab.created_at).toLocaleDateString()}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setEditId(lab.id); setAdding(false); setFormErr(null) }}
                              className="text-xs px-2.5 py-1 rounded border border-blue-100
                                         text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggle(lab)}
                              disabled={toggling === lab.id}
                              className={`text-xs px-2.5 py-1 rounded border transition-colors
                                disabled:opacity-50 disabled:cursor-not-allowed ${
                                  lab.is_active
                                    ? "border-red-100 text-red-600 hover:bg-red-50"
                                    : "border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                                }`}
                            >
                              {toggling === lab.id
                                ? "…"
                                : lab.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                          </div>
                        </td>
                      </>
                    )}

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
