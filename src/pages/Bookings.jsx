import { useEffect, useState, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import {
  fetchBookings, createBooking,
  approveBooking, declineBooking, cancelBooking,
} from "../services/bookingsApi"

// ── Constants ──────────────────────────────────────────────────────────

const STATUS_STYLE = {
  PENDING:   { bg: "bg-amber-50  text-amber-700  border-amber-200",  label: "Pending"   },
  APPROVED:  { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Approved"  },
  DECLINED:  { bg: "bg-red-50    text-red-700    border-red-200",    label: "Declined"  },
  CANCELLED: { bg: "bg-gray-100  text-gray-500   border-gray-200",   label: "Cancelled" },
}

const MANAGER_ROLES = ["SUPER_ADMIN", "LAB_MANAGER", "STORE_KEEPER", "TECHNICIAN", "AUDITOR"]

// ── Small helpers ──────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.PENDING
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${s.bg}`}>
      {s.label}
    </span>
  )
}

function fmt(dateStr) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtTime(t) {
  if (!t) return ""
  const [h, m] = t.split(":")
  const hr = parseInt(h, 10)
  return `${hr % 12 || 12}:${m} ${hr < 12 ? "AM" : "PM"}`
}

// ── New Booking Form (modal) ───────────────────────────────────────────

const EMPTY = {
  title: "", purpose: "", requested_date: "", start_time: "",
  end_time: "", bench_location: "", participants_count: "1", notes: "",
}

function BookingModal({ onClose, onSuccess }) {
  const [form,   setForm]   = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title.trim())      return setError("Title is required")
    if (!form.requested_date)    return setError("Date is required")
    if (!form.start_time)        return setError("Start time is required")
    if (!form.end_time)          return setError("End time is required")
    if (form.start_time >= form.end_time) return setError("End time must be after start time")
    setSaving(true); setError(null)
    try {
      await createBooking(form)
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-semibold text-gray-800">Request a lab slot</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 overflow-y-auto">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Experiment title <span className="text-red-500">*</span>
            </label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="e.g. Titration of Hydrochloric Acid"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Purpose / objective</label>
            <textarea value={form.purpose} onChange={e => set("purpose", e.target.value)}
              rows={2} placeholder="Briefly describe what you intend to do"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input type="date" value={form.requested_date} onChange={e => set("requested_date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Start time <span className="text-red-500">*</span>
              </label>
              <input type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                End time <span className="text-red-500">*</span>
              </label>
              <input type="time" value={form.end_time} onChange={e => set("end_time", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bench / location</label>
              <input value={form.bench_location} onChange={e => set("bench_location", e.target.value)}
                placeholder="e.g. Bench 3A"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">No. of participants</label>
              <input type="number" min="1" value={form.participants_count}
                onChange={e => set("participants_count", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Additional notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              rows={2} placeholder="Equipment needed, special requirements, etc."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? "Submitting…" : "Submit request"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Review panel (approve / decline) ──────────────────────────────────

function ReviewPanel({ booking, onDone }) {
  const [note,     setNote]     = useState("")
  const [working,  setWorking]  = useState(null)
  const [error,    setError]    = useState(null)

  const act = async (action) => {
    setWorking(action); setError(null)
    try {
      if (action === "approve") await approveBooking(booking.id, { review_note: note })
      else                       await declineBooking(booking.id, { review_note: note })
      onDone()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setWorking(null)
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mt-2 space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <textarea value={note} onChange={e => setNote(e.target.value)}
        rows={2} placeholder="Optional note to the student…"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs
                   focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
      <div className="flex gap-2 justify-end">
        <button onClick={() => act("decline")} disabled={!!working}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600
                     hover:bg-red-50 disabled:opacity-50 transition-colors">
          {working === "decline" ? "Declining…" : "Decline"}
        </button>
        <button onClick={() => act("approve")} disabled={!!working}
          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white
                     hover:bg-emerald-700 disabled:opacity-50 transition-colors">
          {working === "approve" ? "Approving…" : "Approve"}
        </button>
      </div>
    </div>
  )
}

// ── Booking card ───────────────────────────────────────────────────────

function BookingCard({ booking, isManager, onRefresh }) {
  const [expanded,   setExpanded]   = useState(false)
  const [reviewing,  setReviewing]  = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelBooking(booking.id)
      onRefresh()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    } finally {
      setCancelling(false)
    }
  }

  const canCancel  = ["PENDING", "APPROVED"].includes(booking.status)
  const canReview  = isManager && booking.status === "PENDING"

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
      {/* Card header row */}
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800 text-sm">{booking.title}</p>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {fmt(booking.requested_date)} &nbsp;·&nbsp;
            {fmtTime(booking.start_time)} – {fmtTime(booking.end_time)}
            {booking.bench_location && ` · ${booking.bench_location}`}
          </p>
          {isManager && booking.requester && (
            <p className="text-xs text-gray-400 mt-0.5">
              Requested by <strong className="text-gray-600">{booking.requester.full_name}</strong>
            </p>
          )}
        </div>
        <span className="text-gray-300 text-xs mt-1 flex-shrink-0">{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-2 text-sm">
          {booking.purpose && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">Purpose</p>
              <p className="text-gray-700 text-xs">{booking.purpose}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div><span className="text-gray-400">Participants:</span> <span className="text-gray-700">{booking.participants_count}</span></div>
            {booking.bench_location && <div><span className="text-gray-400">Bench:</span> <span className="text-gray-700">{booking.bench_location}</span></div>}
          </div>

          {booking.notes && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">Notes</p>
              <p className="text-gray-600 text-xs">{booking.notes}</p>
            </div>
          )}

          {booking.review_note && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-amber-700 mb-0.5">Reviewer note</p>
              <p className="text-xs text-amber-800">{booking.review_note}</p>
              {booking.reviewer && (
                <p className="text-xs text-amber-600 mt-1">— {booking.reviewer.full_name}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap pt-1">
            {canReview && !reviewing && (
              <button onClick={() => setReviewing(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                Review
              </button>
            )}
            {canCancel && !reviewing && (
              <button onClick={handleCancel} disabled={cancelling}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600
                           hover:bg-red-50 disabled:opacity-50 transition-colors">
                {cancelling ? "Cancelling…" : "Cancel booking"}
              </button>
            )}
          </div>

          {reviewing && (
            <ReviewPanel booking={booking} onDone={() => { setReviewing(false); onRefresh() }} />
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────

export default function Bookings() {
  const { role } = useAuth()
  const isManager = MANAGER_ROLES.includes(role)

  const [bookings,     setBookings]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [statusFilter, setStatusFilter] = useState("")
  const [showModal,    setShowModal]    = useState(false)
  const [success,      setSuccess]      = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      setBookings(await fetchBookings(params))
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load bookings")
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    load()
    window.addEventListener("labChanged", load)
    return () => window.removeEventListener("labChanged", load)
  }, [load])

  const handleCreated = () => {
    setSuccess("Booking request submitted successfully.")
    setTimeout(() => setSuccess(null), 4000)
    load()
  }

  // Stat counts
  const pending   = bookings.filter(b => b.status === "PENDING").length
  const approved  = bookings.filter(b => b.status === "APPROVED").length
  const declined  = bookings.filter(b => b.status === "DECLINED").length

  const filtered = statusFilter
    ? bookings.filter(b => b.status === statusFilter)
    : bookings

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Lab Bookings</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isManager ? "Manage slot requests from students and staff" : "Request and track your lab slot bookings"}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                     bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Request slot
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg px-4 py-2 text-sm">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{pending}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Approved</p>
          <p className="text-2xl font-bold text-emerald-600">{approved}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Declined</p>
          <p className="text-2xl font-bold text-red-500">{declined}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 flex flex-wrap gap-2 items-center">
        {["", "PENDING", "APPROVED", "DECLINED", "CANCELLED"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === s
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s || "All"}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
          Loading bookings…
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-2xl mb-2">📅</p>
          <p className="text-sm font-medium text-gray-700">No bookings found</p>
          <p className="text-xs text-gray-400 mt-1">
            {statusFilter ? `No ${statusFilter.toLowerCase()} bookings` : "Click 'Request slot' to make your first booking"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              isManager={isManager}
              onRefresh={load}
            />
          ))}
        </div>
      )}

      {showModal && (
        <BookingModal onClose={() => setShowModal(false)} onSuccess={handleCreated} />
      )}
    </div>
  )
}
