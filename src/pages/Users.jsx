import { useEffect, useState, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { fetchUsers, createUser, toggleUser } from "../services/usersApi"
import { fetchLaboratories } from "../services/laboratoriesApi"

// ── Role config ────────────────────────────────────────────────────────

const ROLE_BADGE = {
  SUPER_ADMIN:  "bg-purple-100 text-purple-700",
  LAB_MANAGER:  "bg-blue-100   text-blue-700",
  STORE_KEEPER: "bg-teal-100   text-teal-700",
  TECHNICIAN:   "bg-amber-100  text-amber-700",
  AUDITOR:      "bg-gray-100   text-gray-600",
}

const ROLE_LABEL = {
  SUPER_ADMIN:  "Super Admin",
  LAB_MANAGER:  "Lab Manager",
  STORE_KEEPER: "Store Keeper",
  TECHNICIAN:   "Technician",
  AUDITOR:      "Auditor",
}

// Roles a caller may assign (indexed by their own role)
const ASSIGNABLE_ROLES = {
  SUPER_ADMIN: ["SUPER_ADMIN", "LAB_MANAGER", "STORE_KEEPER", "TECHNICIAN", "AUDITOR"],
  LAB_MANAGER: ["STORE_KEEPER", "TECHNICIAN", "AUDITOR"],
}

const EMPTY_FORM = { full_name: "", email: "", password: "", role: "", laboratory_id: "" }

// ── Add-user modal ─────────────────────────────────────────────────────

function AddUserModal({ labs, callerRole, callerLabId, onClose, onSuccess }) {
  const [form,    setForm]    = useState({
    ...EMPTY_FORM,
    laboratory_id: callerRole !== "SUPER_ADMIN" ? callerLabId : "",
  })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)
  const [showPwd, setShowPwd] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const roles = ASSIGNABLE_ROLES[callerRole] ?? []
  const activeLabs = labs.filter(l => l.is_active)

  const submit = async () => {
    if (!form.full_name.trim()) return setError("Full name is required")
    if (!form.email.trim())     return setError("Email is required")
    if (!form.password)         return setError("Password is required")
    if (form.password.length < 6) return setError("Password must be at least 6 characters")
    if (!form.role)             return setError("Role is required")
    if (!form.laboratory_id)    return setError("Laboratory is required")

    setSaving(true)
    setError(null)
    try {
      await createUser(form)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Add new user</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Full name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => set("full_name", e.target.value)}
              placeholder="Jane Doe"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="jane@decohas.ac.tz"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={e => set("password", e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400
                           hover:text-gray-600 p-1"
              >
                {showPwd ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={form.role}
              onChange={e => set("role", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700"
            >
              <option value="">Select role…</option>
              {roles.map(r => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>

          {/* Laboratory */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Laboratory <span className="text-red-500">*</span>
            </label>
            {callerRole === "SUPER_ADMIN" ? (
              <select
                value={form.laboratory_id}
                onChange={e => set("laboratory_id", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700"
              >
                <option value="">Select laboratory…</option>
                {activeLabs.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            ) : (
              /* LAB_MANAGER is locked to their own lab */
              <input
                type="text"
                disabled
                value={activeLabs.find(l => l.id === callerLabId)?.name ?? "Your laboratory"}
                className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm
                           bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600
                       hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {saving ? "Creating…" : "Create user"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────

export default function Users() {
  const { role: callerRole, appUser } = useAuth()
  const callerLabId = appUser?.laboratory_id

  const [users,     setUsers]     = useState([])
  const [labs,      setLabs]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [search,    setSearch]    = useState("")
  const [roleFilter,setRoleFilter]= useState("")
  const [showModal, setShowModal] = useState(false)
  const [toggling,  setToggling]  = useState(null)
  const [success,   setSuccess]   = useState(null)

  const canManage = ["SUPER_ADMIN", "LAB_MANAGER"].includes(callerRole)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersData, labsData] = await Promise.all([
        fetchUsers(),
        callerRole === "SUPER_ADMIN" ? fetchLaboratories() : Promise.resolve([]),
      ])
      setUsers(usersData)
      setLabs(labsData)
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [callerRole])

  useEffect(() => {
    load()
    window.addEventListener("labChanged", load)
    return () => window.removeEventListener("labChanged", load)
  }, [load])

  const handleToggle = async (user) => {
    setToggling(user.id)
    try {
      const updated = await toggleUser(user.id)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updated } : u))
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    } finally {
      setToggling(null)
    }
  }

  const handleCreated = () => {
    setSuccess("User created successfully.")
    setTimeout(() => setSuccess(null), 4000)
    load()
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(q) ||
      u.laboratories?.name?.toLowerCase().includes(q)
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  const activeCount   = users.filter(u => u.is_active).length
  const inactiveCount = users.length - activeCount

  if (!canManage) {
    return (
      <div className="bg-red-50 text-red-700 rounded-lg p-6 text-sm">
        Access restricted to Lab Manager and Super Admin.
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Users</h2>
          <p className="text-xs text-gray-400 mt-0.5">Staff accounts and their lab assignments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                     bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add user
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg px-4 py-2 text-sm">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Total staff</p>
          <p className="text-2xl font-bold text-gray-800">{users.length}</p>
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

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4
                      flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name or lab…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64
                     focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-600"
        >
          <option value="">All roles</option>
          {Object.entries(ROLE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {(search || roleFilter) && (
          <button
            onClick={() => { setSearch(""); setRoleFilter("") }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
          Loading users…
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
          No users found.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Laboratory</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Joined</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">

                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{u.full_name}</p>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        ROLE_BADGE[u.role] ?? "bg-gray-100 text-gray-600"
                      }`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {u.laboratories?.name ?? <span className="text-gray-300">—</span>}
                    </td>

                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(u)}
                          disabled={toggling === u.id}
                          className={`text-xs px-2.5 py-1 rounded border transition-colors
                            disabled:opacity-50 disabled:cursor-not-allowed ${
                              u.is_active
                                ? "border-red-100 text-red-600 hover:bg-red-50"
                                : "border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                            }`}
                        >
                          {toggling === u.id ? "…" : u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <AddUserModal
          labs={labs}
          callerRole={callerRole}
          callerLabId={callerLabId}
          onClose={() => setShowModal(false)}
          onSuccess={handleCreated}
        />
      )}
    </div>
  )
}
