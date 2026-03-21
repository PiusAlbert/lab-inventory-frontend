import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate }           from "react-router-dom"
import { fetchItemById }    from "../services/itemsApi"
import { fetchItemBatches } from "../services/batchesApi"
import { fetchTransactions } from "../services/transactionsApi"
import IssueStockModal    from "../components/IssueStockModal"
import ReceiveStockModal  from "../components/ReceiveStockModal"

const TYPE_BADGE = {
  CHEMICAL:   "bg-blue-50 text-blue-700",
  EQUIPMENT:  "bg-teal-50 text-teal-700",
  CONSUMABLE: "bg-gray-100 text-gray-600",
  CRM:        "bg-purple-50 text-purple-700",
}

const HAZARD_BADGE = {
  "Corrosive":     "bg-orange-50 text-orange-700",
  "Flammable":     "bg-red-50 text-red-700",
  "Non-Hazardous": "bg-green-50 text-green-700",
  "Oxidizer":      "bg-purple-50 text-purple-700",
  "Other":         "bg-gray-50 text-gray-500",
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
}

function Field({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-gray-800 ${mono ? "font-mono" : ""}`}>
        {value ?? <span className="text-gray-300 font-normal">—</span>}
      </p>
    </div>
  )
}

/** Chemical-specific details panel */
function ChemicalDetails({ d }) {
  if (!d) return null
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
      <h3 className="text-sm font-semibold text-blue-800 mb-4">Chemical details</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        <Field label="Formula"             value={d.formula} mono />
        <Field label="CAS number"          value={d.cas_number} mono />
        <Field label="Molecular weight"    value={d.molecular_weight ? `${d.molecular_weight} g/mol` : null} />
        <Field label="PubChem ID"          value={d.pubchem_id} mono />
        <Field label="GHS classification"  value={d.ghp_classification} />
        {d.msds_url && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">MSDS</p>
            <a href={d.msds_url} target="_blank" rel="noreferrer"
               className="text-sm text-blue-600 hover:underline font-medium">
              View MSDS ↗
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

/** Equipment-specific details panel */
function EquipmentDetails({ d }) {
  if (!d) return null
  return (
    <div className="bg-teal-50 border border-teal-100 rounded-lg p-6">
      <h3 className="text-sm font-semibold text-teal-800 mb-4">Equipment details</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        <Field label="Model number"           value={d.model_number} mono />
        <Field label="Serial number"          value={d.serial_number} mono />
        <Field label="Maintenance interval"
               value={d.maintenance_interval_days ? `Every ${d.maintenance_interval_days} days` : null} />
        <Field label="Last maintenance"
               value={d.last_maintenance_date
                 ? new Date(d.last_maintenance_date).toLocaleDateString() : null} />
        <Field label="Warranty expiry"
               value={d.warranty_expiry
                 ? new Date(d.warranty_expiry).toLocaleDateString() : null} />
      </div>
    </div>
  )
}

/** CRM / Reference material details panel */
function ReferenceDetails({ d }) {
  if (!d) return null
  const days = daysUntil(d.certification_expiry)
  return (
    <div className="bg-purple-50 border border-purple-100 rounded-lg p-6">
      <h3 className="text-sm font-semibold text-purple-800 mb-4">Reference material details</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
        <Field label="Certification number" value={d.certification_number} mono />
        <Field label="Issuing body"         value={d.issuing_body} />
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Certification expiry</p>
          {d.certification_expiry ? (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-800">
                {new Date(d.certification_expiry).toLocaleDateString()}
              </p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                days < 0   ? "bg-red-100 text-red-700"    :
                days <= 30 ? "bg-amber-50 text-amber-700" :
                             "bg-green-50 text-green-700"
              }`}>
                {days < 0 ? "Expired" : `${days}d left`}
              </span>
            </div>
          ) : <span className="text-sm text-gray-300">—</span>}
        </div>
      </div>
    </div>
  )
}

export default function ItemDetails() {

  const { id }   = useParams()
  const navigate = useNavigate()

  const [item,         setItem]         = useState(null)
  const [batches,      setBatches]      = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [issueModal,   setIssueModal]   = useState(false)
  const [receiveModal, setReceiveModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [itemData, batchData, trxData] = await Promise.all([
        fetchItemById(id),
        fetchItemBatches(id),
        fetchTransactions()
      ])
      setItem(itemData)
      setBatches(Array.isArray(batchData) ? batchData : [])
      const itemTrx = Array.isArray(trxData)
        ? trxData.filter(t => t.item_id === id || t.items?.id === id).slice(0, 20)
        : []
      setTransactions(itemTrx)
    } catch (err) {
      const msg = err.response?.data?.error
        || (err.message?.includes("JSON") ? "API URL misconfigured — check VITE_API_BASE_URL" : err.message)
        || "Failed to load item"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const totalStock = batches.reduce((sum, b) => sum + Number(b.current_quantity), 0)
  const isLowStock = item && totalStock < Number(item.minimum_threshold)

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-sm text-gray-400">
      Loading item...
    </div>
  )

  if (error) return (
    <div className="space-y-3 max-w-lg">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
        <p className="font-medium mb-1">Failed to load item</p>
        <p className="text-red-500 text-xs">{error}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={load}
          className="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          Retry
        </button>
        <button onClick={() => navigate("/items")}
          className="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          ← Back to items
        </button>
      </div>
    </div>
  )

  if (!item) return null

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── HEADER ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate("/items")}
            className="text-xs text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
            ← Back to items
          </button>
          <h2 className="text-xl font-semibold text-gray-800">{item.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {item.sku}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                             ${TYPE_BADGE[item.item_type] ?? "bg-gray-100 text-gray-500"}`}>
              {item.item_type}
            </span>
            {item.hazard_class && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                               ${HAZARD_BADGE[item.hazard_class] ?? "bg-gray-100 text-gray-500"}`}>
                {item.hazard_class}
              </span>
            )}
            {isLowStock && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                ⚠ Low stock
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button onClick={() => setReceiveModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                       bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            ↓ Receive
          </button>
          <button onClick={() => setIssueModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                       bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
            ↑ Issue
          </button>
          <button onClick={() => navigate(`/items/${id}/edit`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                       border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Edit
          </button>
        </div>
      </div>


      {/* ── STOCK SUMMARY ───────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`rounded-lg p-4 ${isLowStock ? "bg-red-50" : "bg-green-50"}`}>
          <p className="text-xs text-gray-500 mb-1">Total stock</p>
          <p className={`text-2xl font-bold ${isLowStock ? "text-red-600" : "text-green-700"}`}>
            {totalStock}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{item.unit_of_measure}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Min. threshold</p>
          <p className="text-2xl font-bold text-gray-700">{item.minimum_threshold}</p>
          <p className="text-xs text-gray-400 mt-0.5">{item.unit_of_measure}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Active batches</p>
          <p className="text-2xl font-bold text-gray-700">
            {batches.filter(b => b.current_quantity > 0).length}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">of {batches.length} total</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Reorder qty</p>
          <p className="text-2xl font-bold text-gray-700">{item.reorder_quantity ?? "—"}</p>
          <p className="text-xs text-gray-400 mt-0.5">{item.unit_of_measure}</p>
        </div>
      </div>


      {/* ── CORE DETAILS ────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-5">Item details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          <Field label="Category"          value={item.categories?.name} />
          <Field label="Supplier"          value={item.suppliers?.name} />
          <Field label="Unit of measure"   value={item.unit_of_measure} />
          <Field label="Item type"         value={item.item_type} />
          <Field label="Hazard class"      value={item.hazard_class} />
          <Field label="Storage condition" value={item.storage_condition} />
          <Field label="Max stock level"   value={item.max_stock_level} />
          <Field label="Unit price"        value={item.unit_price ? `$${item.unit_price}` : null} />
          <Field label="Perishable"        value={item.is_perishable ? "Yes" : "No"} />
          <Field label="Barcode"           value={item.barcode} mono />
          <Field label="SKU"               value={item.sku} mono />
          <Field label="Created"           value={new Date(item.created_at).toLocaleDateString()} />
        </div>
        {item.regulatory_notes && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Regulatory notes</p>
            <p className="text-sm text-gray-700">{item.regulatory_notes}</p>
          </div>
        )}
      </div>


      {/* ── TYPE-SPECIFIC EXTENSION PANELS ──────────── */}
      <ChemicalDetails   d={item.item_chemical_details} />
      <EquipmentDetails  d={item.item_equipment_details} />
      <ReferenceDetails  d={item.item_reference_details} />


      {/* ── STOCK BATCHES ───────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Stock batches</h3>
          <button onClick={() => setReceiveModal(true)}
            className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg
                       hover:bg-green-700 transition-colors font-medium">
            ↓ Receive new batch
          </button>
        </div>
        {batches.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            No batches yet. Receive stock to create the first batch.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Batch #</th>
                <th className="text-left px-6 py-3">Received</th>
                <th className="text-left px-6 py-3">Current qty</th>
                <th className="text-left px-6 py-3">Expiry</th>
                <th className="text-left px-6 py-3">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {batches.map(b => {
                const days = daysUntil(b.expiry_date)
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">
                      {b.batch_number || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {b.quantity_received} {item.unit_of_measure}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`font-semibold ${
                        b.current_quantity === 0 ? "text-red-600"   :
                        b.current_quantity < 5   ? "text-amber-600" : "text-gray-800"
                      }`}>{b.current_quantity}</span>
                      <span className="text-xs text-gray-400 ml-1">{item.unit_of_measure}</span>
                    </td>
                    <td className="px-6 py-3">
                      {b.expiry_date ? (
                        <div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            days < 0   ? "bg-red-100 text-red-700"    :
                            days <= 30 ? "bg-amber-50 text-amber-700" :
                                         "bg-gray-100 text-gray-600"
                          }`}>
                            {days < 0 ? "Expired" : `${days}d left`}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(b.expiry_date).toLocaleDateString()}
                          </p>
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {b.storage_location || <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>


      {/* ── TRANSACTION HISTORY ─────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Transaction history</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            No transactions recorded for this item.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Type</th>
                <th className="text-left px-6 py-3">Quantity</th>
                <th className="text-left px-6 py-3">Reference</th>
                <th className="text-left px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      t.transaction_type === "ISSUE"
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
                    }`}>
                      {t.transaction_type === "ISSUE" ? "Issue" : "Receive"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {t.quantity} {item.unit_of_measure}
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-400 font-mono">
                    {t.reference || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-400">
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


      {/* ── MODALS ──────────────────────────────────── */}
      {issueModal && (
        <IssueStockModal
          itemId={item.id}
          itemName={item.name}
          onClose={() => setIssueModal(false)}
          onSuccess={load}
        />
      )}
      {receiveModal && (
        <ReceiveStockModal
          itemId={item.id}
          itemName={item.name}
          onClose={() => setReceiveModal(false)}
          onSuccess={load}
        />
      )}

    </div>
  )
}