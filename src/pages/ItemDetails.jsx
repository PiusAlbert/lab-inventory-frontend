import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { fetchItemById } from "../services/itemsApi"
import { fetchItemBatches } from "../services/batchesApi"
import { fetchTransactions } from "../services/transactionsApi"
import IssueStockModal from "../components/IssueStockModal"
import ReceiveStockModal from "../components/ReceiveStockModal"
import EditBatchModal from "../components/EditBatchModal"

const TYPE_BADGE = {
  CHEMICAL: "bg-blue-50 text-blue-700",
  EQUIPMENT: "bg-teal-50 text-teal-700",
  CONSUMABLE: "bg-gray-100 text-gray-600",
  CRM: "bg-purple-50 text-purple-700",
}

const HAZARD_BADGE = {
  Corrosive: "bg-orange-50 text-orange-700",
  Flammable: "bg-red-50 text-red-700",
  "Non-Hazardous": "bg-green-50 text-green-700",
  Oxidizer: "bg-purple-50 text-purple-700",
  Toxic: "bg-rose-50 text-rose-700",
  Explosive: "bg-red-100 text-red-800",
  Other: "bg-gray-50 text-gray-500",
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

function ChemicalDetails({ d }) {
  if (!d) return null
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
      <h3 className="text-sm font-semibold text-blue-800 mb-4">Chemical details</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        <Field label="Formula" value={d.formula} mono />
        <Field label="CAS number" value={d.cas_number} mono />
        <Field
          label="Molecular weight"
          value={d.molecular_weight ? `${d.molecular_weight} g/mol` : null}
        />
        <Field label="PubChem ID" value={d.pubchem_id} mono />
        <Field label="GHS classification" value={d.ghp_classification} />
        {d.msds_url && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">MSDS</p>
            <a
              href={d.msds_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              View MSDS ↗
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function EquipmentDetails({ d }) {
  if (!d) return null
  return (
    <div className="bg-teal-50 border border-teal-100 rounded-lg p-6">
      <h3 className="text-sm font-semibold text-teal-800 mb-4">Equipment details</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        <Field label="Model number" value={d.model_number} mono />
        <Field label="Serial number" value={d.serial_number} mono />
        <Field
          label="Maintenance interval"
          value={d.maintenance_interval_days ? `Every ${d.maintenance_interval_days} days` : null}
        />
        <Field
          label="Last maintenance"
          value={d.last_maintenance_date ? new Date(d.last_maintenance_date).toLocaleDateString() : null}
        />
        <Field
          label="Warranty expiry"
          value={d.warranty_expiry ? new Date(d.warranty_expiry).toLocaleDateString() : null}
        />
      </div>
    </div>
  )
}

function ReferenceDetails({ d }) {
  if (!d) return null
  const days = daysUntil(d.certification_expiry)

  return (
    <div className="bg-purple-50 border border-purple-100 rounded-lg p-6">
      <h3 className="text-sm font-semibold text-purple-800 mb-4">Reference material details</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
        <Field label="Certification number" value={d.certification_number} mono />
        <Field label="Issuing body" value={d.issuing_body} />
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Certification expiry</p>
          {d.certification_expiry ? (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-800">
                {new Date(d.certification_expiry).toLocaleDateString()}
              </p>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  days < 0
                    ? "bg-red-100 text-red-700"
                    : days <= 30
                      ? "bg-amber-50 text-amber-700"
                      : "bg-green-50 text-green-700"
                }`}
              >
                {days < 0 ? "Expired" : `${days}d left`}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-300">—</span>
          )}
        </div>
      </div>
    </div>
  )
}

function ExpiryPill({ date }) {
  if (!date) return <span className="text-gray-300">—</span>

  const days = daysUntil(date)
  const label = new Date(date).toLocaleDateString()

  if (days < 0) {
    return (
      <div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
          Expired
        </span>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    )
  }

  if (days <= 30) {
    return (
      <div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
          {days}d left
        </span>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    )
  }

  return <p className="text-sm text-gray-600">{label}</p>
}

export default function ItemDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [item, setItem] = useState(null)
  const [batches, setBatches] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [issueModal, setIssueModal] = useState(false)
  const [receiveModal, setReceiveModal] = useState(false)
  const [editBatch, setEditBatch] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [itemData, batchData, trxData] = await Promise.all([
        fetchItemById(id),
        fetchItemBatches(id),
        fetchTransactions(),
      ])

      setItem(itemData)
      setBatches(Array.isArray(batchData) ? batchData : [])

      const itemTrx = Array.isArray(trxData)
        ? trxData.filter((t) => t.item_id === id || t.items?.id === id).slice(0, 20)
        : []

      setTransactions(itemTrx)
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.message?.includes("JSON")
          ? "API URL misconfigured — check VITE_API_BASE_URL"
          : err.message) ||
        "Failed to load item"

      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const totalStock = batches.reduce((sum, b) => sum + Number(b.current_quantity || 0), 0)
  const stockUnit = item?.dispensing_unit || item?.unit_of_measure || "units"
  const isLowStock = item ? totalStock < Number(item.minimum_threshold || 0) : false

  const chemicalDetails = Array.isArray(item?.item_chemical_details)
    ? item.item_chemical_details[0]
    : item?.item_chemical_details

  const equipmentDetails = Array.isArray(item?.item_equipment_details)
    ? item.item_equipment_details[0]
    : item?.item_equipment_details

  const referenceDetails = Array.isArray(item?.item_reference_details)
    ? item.item_reference_details[0]
    : item?.item_reference_details

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        Loading item...
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3 max-w-lg">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          <p className="font-medium mb-1">Failed to load item</p>
          <p className="text-red-500 text-xs">{error}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Retry
          </button>
          <button
            onClick={() => navigate("/items")}
            className="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            ← Back to items
          </button>
        </div>
      </div>
    )
  }

  if (!item) return null

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/items")}
            className="text-xs text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1"
          >
            ← Back to items
          </button>

          <h2 className="text-xl font-semibold text-gray-800">{item.name}</h2>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {item.sku}
            </span>

            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                TYPE_BADGE[item.item_type] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {item.item_type}
            </span>

            {item.hazard_class && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  HAZARD_BADGE[item.hazard_class] ?? "bg-gray-50 text-gray-500"
                }`}
              >
                {item.hazard_class}
              </span>
            )}

            {isLowStock && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                Low stock
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(`/items/${item.id}/edit`)}
            className="px-4 py-2 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50"
          >
            Edit Item
          </button>
          <button
            onClick={() => setReceiveModal(true)}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ↓ Receive stock
          </button>
          <button
            onClick={() => setIssueModal(true)}
            className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            ↑ Issue stock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 lg:col-span-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Item summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            <Field label="Category" value={item.categories?.name} />
            <Field label="Barcode" value={item.barcode} mono />
            <Field label="Stock unit" value={item.unit_of_measure} />
            <Field label="Dispensing unit" value={item.dispensing_unit || item.unit_of_measure} />
            <Field
              label="Conversion factor"
              value={item.conversion_factor ? `1 ${item.unit_of_measure} = ${item.conversion_factor} ${item.dispensing_unit}` : null}
            />
            <Field label="Current stock" value={`${totalStock} ${stockUnit}`} />
            <Field label="Minimum threshold" value={`${item.minimum_threshold ?? 0} ${stockUnit}`} />
            <Field
              label="Reorder quantity"
              value={item.reorder_quantity != null ? `${item.reorder_quantity} ${stockUnit}` : null}
            />
            <Field
              label="Maximum stock"
              value={item.max_stock_level != null ? `${item.max_stock_level} ${stockUnit}` : null}
            />
            <Field
              label="Unit price"
              value={item.unit_price != null ? `TZS ${Number(item.unit_price).toLocaleString()}` : null}
            />
            <Field label="Storage condition" value={item.storage_condition} />
            <Field label="Perishable" value={item.is_perishable ? "Yes" : "No"} />
          </div>

          {item.regulatory_notes && (
            <div className="mt-5">
              <p className="text-xs text-gray-400 mb-1">Regulatory notes</p>
              <div className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-3 whitespace-pre-wrap">
                {item.regulatory_notes}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Stock status</h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">On hand</p>
              <p className="text-2xl font-bold text-gray-800">
                {totalStock} <span className="text-sm font-medium text-gray-500">{stockUnit}</span>
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Batches</p>
              <p className="text-lg font-semibold text-gray-700">{batches.length}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <span
                className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${
                  isLowStock ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
                }`}
              >
                {isLowStock ? "Below threshold" : "Healthy"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ChemicalDetails d={chemicalDetails} />
      <EquipmentDetails d={equipmentDetails} />
      <ReferenceDetails d={referenceDetails} />

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Batches</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Quantity is tracked in {stockUnit}
            </p>
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No batches recorded for this item.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Batch</th>
                  <th className="px-4 py-3 font-medium">Current Qty</th>
                  <th className="px-4 py-3 font-medium">Received Qty</th>
                  <th className="px-4 py-3 font-medium">Expiry</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="border-b border-gray-50 hover:bg-gray-50/70">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{batch.batch_number || "—"}</div>
                      <div className="text-xs text-gray-400">
                        Received {batch.received_at ? new Date(batch.received_at).toLocaleDateString() : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {Number(batch.current_quantity || 0).toLocaleString()} {stockUnit}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {Number(batch.quantity_received || 0).toLocaleString()} {stockUnit}
                    </td>
                    <td className="px-4 py-3">
                      <ExpiryPill date={batch.expiry_date} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {batch.storage_location || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditBatch(batch)}
                          className="text-xs px-2.5 py-1 border border-blue-100 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Recent transactions</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No transactions found for this item.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Batch</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((trx) => (
                  <tr key={trx.id} className="border-b border-gray-50 hover:bg-gray-50/70">
                    <td className="px-4 py-3 text-gray-600">
                      {trx.created_at ? new Date(trx.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          trx.transaction_type === "ISSUE"
                            ? "bg-red-50 text-red-700"
                            : trx.transaction_type === "RECEIVE"
                              ? "bg-green-50 text-green-700"
                              : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {trx.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {Number(trx.quantity || 0).toLocaleString()} {stockUnit}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {trx.stock_batches?.batch_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {trx.reference || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      <div className="truncate">{trx.notes || <span className="text-gray-300">—</span>}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

      {editBatch && (
        <EditBatchModal
          batch={editBatch}
          item={item}
          onClose={() => setEditBatch(null)}
          onSuccess={load}
        />
      )}
    </div>
  )
}