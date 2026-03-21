import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { fetchCategories } from "../services/categoriesApi"
import { createItem }      from "../services/itemsApi"

const ITEM_TYPES = ["EQUIPMENT", "CHEMICAL", "CONSUMABLE", "CRM"]

const HAZARD_CLASSES = [
  "Non-Hazardous", "Flammable", "Corrosive",
  "Oxidizer", "Toxic", "Explosive", "Other"
]

const UNITS = [
  "pcs", "g", "kg", "mg", "L", "mL", "box",
  "roll", "bag", "bottle", "jar", "pack", "set"
]

const EMPTY_FORM = {
  name:               "",
  sku:                "",
  barcode:            "",
  item_type:          "CONSUMABLE",
  category_id:        "",
  supplier_id:        "",
  unit_of_measure:    "pcs",
  minimum_threshold:  1,
  reorder_quantity:   "",
  max_stock_level:    "",
  unit_price:         "",
  hazard_class:       "",
  storage_condition:  "",
  regulatory_notes:   "",
  is_perishable:      false,
}

const EMPTY_EXT = {
  // CHEMICAL
  formula:                  "",
  cas_number:               "",
  // EQUIPMENT
  model_number:             "",
  serial_number:            "",
  maintenance_interval_days: "",
  warranty_expiry:          "",
  // CRM
  certification_number:     "",
  certification_expiry:     "",
  issuing_body:             "",
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, type = "text", placeholder, disabled }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-200
                 disabled:bg-gray-50 disabled:text-gray-400"
    />
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o =>
        typeof o === "string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  )
}

export default function AddItem() {

  const navigate = useNavigate()

  const [form,       setForm]       = useState(EMPTY_FORM)
  const [ext,        setExt]        = useState(EMPTY_EXT)
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error)
  }, [])

  const set = (field) => (e) =>
    setForm(f => ({ ...f, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }))

  const setE = (field) => (e) =>
    setExt(x => ({ ...x, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim())        errs.name         = "Name is required"
    if (!form.sku.trim())         errs.sku          = "SKU is required"
    if (!form.item_type)          errs.item_type    = "Item type is required"
    if (!form.category_id)        errs.category_id  = "Category is required"
    if (!form.unit_of_measure)    errs.unit_of_measure = "Unit is required"
    if (form.item_type === "CHEMICAL" && !form.hazard_class)
      errs.hazard_class = "Hazard class is required for chemicals"
    if (form.item_type === "EQUIPMENT" && !ext.maintenance_interval_days)
      errs.maintenance_interval_days = "Maintenance interval is required for equipment"
    if (form.item_type === "CRM" && !ext.certification_expiry)
      errs.certification_expiry = "Certification expiry is required for CRM"
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }

    setFieldErrors({})
    setError(null)
    setLoading(true)

    try {
      const payload = {
        ...form,
        minimum_threshold: Number(form.minimum_threshold) || 0,
        reorder_quantity:  form.reorder_quantity  ? Number(form.reorder_quantity)  : null,
        max_stock_level:   form.max_stock_level   ? Number(form.max_stock_level)   : null,
        unit_price:        form.unit_price        ? Number(form.unit_price)        : null,
        extension_data:    buildExtension(),
      }

      const newItem = await createItem(payload)
      navigate(`/items/${newItem.id}`)
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to create item")
    } finally {
      setLoading(false)
    }
  }

  const buildExtension = () => {
    if (form.item_type === "CHEMICAL") return {
      formula:         ext.formula         || null,
      cas_number:      ext.cas_number      || null,
    }
    if (form.item_type === "EQUIPMENT") return {
      model_number:              ext.model_number              || null,
      serial_number:             ext.serial_number             || null,
      maintenance_interval_days: Number(ext.maintenance_interval_days) || null,
      warranty_expiry:           ext.warranty_expiry           || null,
    }
    if (form.item_type === "CRM") return {
      certification_number: ext.certification_number || null,
      certification_expiry: ext.certification_expiry || null,
      issuing_body:         ext.issuing_body         || null,
    }
    return {}
  }

  const err = (field) => fieldErrors[field]
    ? <p className="text-xs text-red-500 mt-1">{fieldErrors[field]}</p>
    : null

  return (
    <div className="max-w-3xl space-y-6">

      {/* HEADER */}
      <div>
        <button
          onClick={() => navigate("/items")}
          className="text-xs text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1"
        >
          ← Back to items
        </button>
        <h2 className="text-xl font-semibold text-gray-800">Add new item</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Register a new item in the inventory
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* CORE DETAILS */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Core details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <Field label="Item name" required>
            <Input value={form.name} onChange={set("name")} placeholder="e.g. Sulphuric Acid" />
            {err("name")}
          </Field>

          <Field label="SKU" required hint="Must be unique within this lab">
            <Input value={form.sku} onChange={set("sku")} placeholder="e.g. LAB1-CH-0001" />
            {err("sku")}
          </Field>

          <Field label="Item type" required>
            <Select
              value={form.item_type}
              onChange={set("item_type")}
              options={ITEM_TYPES}
            />
            {err("item_type")}
          </Field>

          <Field label="Category" required>
            <Select
              value={form.category_id}
              onChange={set("category_id")}
              placeholder="Select category..."
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
            {err("category_id")}
          </Field>

          <Field label="Unit of measure" required>
            <Select
              value={form.unit_of_measure}
              onChange={set("unit_of_measure")}
              options={UNITS}
            />
            {err("unit_of_measure")}
          </Field>

          <Field label="Barcode">
            <Input value={form.barcode} onChange={set("barcode")} placeholder="Optional" />
          </Field>

        </div>
      </div>


      {/* STOCK THRESHOLDS */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Stock levels</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <Field label="Minimum threshold" required hint="Alert when stock falls below this">
            <Input
              type="number"
              value={form.minimum_threshold}
              onChange={set("minimum_threshold")}
              placeholder="e.g. 5"
            />
          </Field>

          <Field label="Reorder quantity" hint="How much to order when restocking">
            <Input
              type="number"
              value={form.reorder_quantity}
              onChange={set("reorder_quantity")}
              placeholder="e.g. 20"
            />
          </Field>

          <Field label="Max stock level">
            <Input
              type="number"
              value={form.max_stock_level}
              onChange={set("max_stock_level")}
              placeholder="e.g. 100"
            />
          </Field>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Unit price ($)">
            <Input
              type="number"
              value={form.unit_price}
              onChange={set("unit_price")}
              placeholder="e.g. 12.50"
            />
          </Field>

          <Field label="Storage condition">
            <Input
              value={form.storage_condition}
              onChange={set("storage_condition")}
              placeholder="e.g. Room temperature, Cold room"
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_perishable}
            onChange={set("is_perishable")}
            className="rounded"
          />
          This item is perishable
        </label>
      </div>


      {/* CHEMICAL FIELDS */}
      {form.item_type === "CHEMICAL" && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Chemical details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Field label="Hazard class" required>
              <Select
                value={form.hazard_class}
                onChange={set("hazard_class")}
                placeholder="Select hazard class..."
                options={HAZARD_CLASSES}
              />
              {err("hazard_class")}
            </Field>

            <Field label="CAS number">
              <Input value={ext.cas_number} onChange={setE("cas_number")} placeholder="e.g. 7664-93-9" />
            </Field>

            <Field label="Chemical formula">
              <Input value={ext.formula} onChange={setE("formula")} placeholder="e.g. H₂SO₄" />
            </Field>

            <Field label="Regulatory notes">
              <Input
                value={form.regulatory_notes}
                onChange={set("regulatory_notes")}
                placeholder="e.g. Handle in fume hood"
              />
            </Field>

          </div>
        </div>
      )}


      {/* EQUIPMENT FIELDS */}
      {form.item_type === "EQUIPMENT" && (
        <div className="bg-teal-50 border border-teal-100 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-teal-800 mb-2">Equipment details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Field label="Model number">
              <Input value={ext.model_number} onChange={setE("model_number")} placeholder="e.g. XL-3000" />
            </Field>

            <Field label="Serial number">
              <Input value={ext.serial_number} onChange={setE("serial_number")} placeholder="e.g. SN-12345" />
            </Field>

            <Field label="Maintenance interval (days)" required hint="How often this equipment needs servicing">
              <Input
                type="number"
                value={ext.maintenance_interval_days}
                onChange={setE("maintenance_interval_days")}
                placeholder="e.g. 90"
              />
              {err("maintenance_interval_days")}
            </Field>

            <Field label="Warranty expiry">
              <Input type="date" value={ext.warranty_expiry} onChange={setE("warranty_expiry")} />
            </Field>

          </div>
        </div>
      )}


      {/* CRM FIELDS */}
      {form.item_type === "CRM" && (
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-purple-800 mb-2">Reference material details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Field label="Certification number">
              <Input value={ext.certification_number} onChange={setE("certification_number")} placeholder="e.g. CERT-2026-001" />
            </Field>

            <Field label="Certification expiry" required>
              <Input type="date" value={ext.certification_expiry} onChange={setE("certification_expiry")} />
              {err("certification_expiry")}
            </Field>

            <Field label="Issuing body">
              <Input value={ext.issuing_body} onChange={setE("issuing_body")} placeholder="e.g. NIST, ISO" />
            </Field>

          </div>
        </div>
      )}


      {/* ACTIONS */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          onClick={() => navigate("/items")}
          disabled={loading}
          className="px-5 py-2 text-sm border border-gray-200 rounded-lg
                     hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create item"}
        </button>
      </div>

    </div>
  )
}