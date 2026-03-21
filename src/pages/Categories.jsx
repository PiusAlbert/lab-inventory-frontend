import { useEffect, useState, useCallback } from "react"
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from "../services/categoriesApi"

const EMPTY_FORM = { name: "", description: "", is_hazardous: false }

export default function Categories() {

  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [editTarget, setEditTarget] = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [formError,  setFormError]  = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setCategories(await fetchCategories())
    } catch (err) {
      setError(err.message || "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (cat) => {
    setEditTarget(cat)
    setForm({ name: cat.name, description: cat.description ?? "", is_hazardous: cat.is_hazardous ?? false })
    setFormError(null)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Name is required"); return }
    setSaving(true); setFormError(null)
    try {
      if (editTarget) {
        await updateCategory(editTarget.id, form)
      } else {
        await createCategory(form)
      }
      setShowForm(false)
      load()
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCategory(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete category")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* TOP BAR */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Categories</h2>
          <p className="text-xs text-gray-400 mt-0.5">{categories.length} categories</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                     bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ＋ Add category
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10
                        text-center text-sm text-gray-400">Loading...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">{error}</div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10
                        text-center text-sm text-gray-400">
          No categories yet.{" "}
          <button onClick={openCreate} className="text-blue-600 underline">Add one</button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">Hazardous</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {cat.description || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {cat.is_hazardous ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full
                                       bg-red-50 text-red-700">Yes</span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full
                                       bg-gray-100 text-gray-500">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(cat.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-xs px-2.5 py-1 border border-gray-200 rounded
                                   text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="text-xs px-2.5 py-1 border border-red-100 rounded
                                   text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800">
                {editTarget ? "Edit category" : "New category"}
              </h3>
              <button onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg
                              px-3 py-2 text-sm mb-4">{formError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Chemicals"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_hazardous}
                  onChange={e => setForm(f => ({ ...f, is_hazardous: e.target.checked }))}
                  className="rounded"
                />
                Mark as hazardous
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg
                           hover:bg-blue-700 disabled:opacity-60 font-medium">
                {saving ? "Saving..." : editTarget ? "Save changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Delete category</h3>
            <p className="text-sm text-gray-500 mb-5">
              Delete <span className="font-medium text-gray-800">{deleteTarget.name}</span>?
              Items linked to this category will have their category set to null.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg
                           hover:bg-red-700 disabled:opacity-60">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}