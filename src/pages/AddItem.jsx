import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { fetchCategories } from "../services/categoriesApi"
import { createItem } from "../services/itemsApi"
import { useAuth } from "../context/AuthContext"

const ITEM_TYPES = ["EQUIPMENT", "CHEMICAL", "CONSUMABLE", "CRM"]

const HAZARD_CLASSES = [
  "Non-Hazardous",
  "Flammable",
  "Corrosive",
  "Oxidizer",
  "Toxic",
  "Explosive",
  "Other",
]

const UNITS = [
  "pcs",
  "g",
  "kg",
  "mg",
  "L",
  "mL",
  "box",
  "roll",
  "bag",
  "bottle",
  "jar",
  "pack",
  "set",
]

const EMPTY_FORM = {
  name: "",
  sku: "",
  barcode: "",
  item_type: "CONSUMABLE",
  category_id: "",
  supplier_id: "",
  unit_of_measure: "pcs",
  dispensing_unit: "",
  conversion_factor: "",
  minimum_threshold: 1,
  reorder_quantity: "",
  max_stock_level: "",
  unit_price: "",
  hazard_class: "",
  storage_condition: "",
  regulatory_notes: "",
  is_perishable: false,
}

const EMPTY_EXT = {
  // CHEMICAL
  formula: "",
  cas_number: "",
  molecular_weight: "",
  msds_url: "",
  pubchem_id: "",
  ghp_classification: "",

  // EQUIPMENT
  model_number: "",
  serial_number: "",
  maintenance_interval_days: "",
  last_maintenance_date: "",
  warranty_expiry: "",

  // CRM
  certification_number: "",
  certification_expiry: "",
  issuing_body: "",
}

function Field({ label, required, children, hint, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  min,
  step,
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      step={step}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-200
                 disabled:bg-gray-50 disabled:text-gray-400"
    />
  )
}

function Select({ value, onChange, options, placeholder, disabled = false }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700
                 disabled:bg-gray-50 disabled:text-gray-400"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        )
      )}
    </select>
  )
}

export default function AddItem() {
  const navigate = useNavigate()
  const { isAdmin, requiresLabSelection } = useAuth()

  const [form, setForm] = useState(EMPTY_FORM)
  const [ext, setExt] = useState(EMPTY_EXT)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const labRequired = isAdmin && requiresLabSelection

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error)
  }, [])

  const set = (field) => (e) =>
    setForm((f) => ({
      ...f,
      [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }))

  const setE = (field) => (e) =>
    setExt((x) => ({ ...x, [field]: e.target.value }))

  const isChemical = form.item_type === "CHEMICAL"
  const isEquipment = form.item_type === "EQUIPMENT"
  const isCRM = form.item_type === "CRM"
  const usesDualUnit = Boolean(form.dispensing_unit && form.conversion_factor)

  const validate = () => {
    const errs = {}

    if (!form.name.trim()) errs.name = "Name is required"
    if (!form.sku.trim()) errs.sku = "SKU is required"
    if (!form.item_type) errs.item_type = "Item type is required"
    if (!form.category_id) errs.category_id = "Category is required"
    if (!form.unit_of_measure) errs.unit_of_measure = "Unit of measure is required"

    if (form.minimum_threshold === "" || Number(form.minimum_threshold) < 0) {
      errs.minimum_threshold = "Minimum threshold must be 0 or greater"
    }

    if (form.reorder_quantity !== "" && Number(form.reorder_quantity) < 0) {
      errs.reorder_quantity = "Reorder quantity must be 0 or greater"
    }

    if (form.max_stock_level !== "" && Number(form.max_stock_level) < 0) {
      errs.max_stock_level = "Maximum stock level must be 0 or greater"
    }

    if (form.unit_price !== "" && Number(form.unit_price) < 0) {
      errs.unit_price = "Unit price must be 0 or greater"
    }

    if (form.dispensing_unit && (!form.conversion_factor || Number(form.conversion_factor) <= 0)) {
      errs.conversion_factor = "Conversion factor must be greater than 0"
    }

    if (!form.dispensing_unit && form.conversion_factor) {
      errs.dispensing_unit = "Dispensing unit is required when conversion factor is set"
    }

    if (isChemical && !form.hazard_class) {
      errs.hazard_class = "Hazard class is required for chemical items"
    }

    if (isEquipment && !ext.maintenance_interval_days) {
      errs.maintenance_interval_days = "Maintenance interval is required for equipment"
    }

    if (isCRM && !ext.certification_expiry) {
      errs.certification_expiry = "Certification expiry is required for CRM items"
    }

    return errs
  }

  const buildPayload = () => {
    const extension_data = isChemical
      ? {
          formula: ext.formula || null,
          cas_number: ext.cas_number || null,
          molecular_weight: ext.molecular_weight === "" ? null : Number(ext.molecular_weight),
          msds_url: ext.msds_url || null,
          pubchem_id: ext.pubchem_id === "" ? null : Number(ext.pubchem_id),
          ghp_classification: ext.ghp_classification || null,
        }
      : isEquipment
        ? {
            model_number: ext.model_number || null,
            serial_number: ext.serial_number || null,
            maintenance_interval_days:
              ext.maintenance_interval_days === "" ? null : Number(ext.maintenance_interval_days),
            last_maintenance_date: ext.last_maintenance_date || null,
            warranty_expiry: ext.warranty_expiry || null,
          }
        : isCRM
          ? {
              certification_number: ext.certification_number || null,
              certification_expiry: ext.certification_expiry || null,
              issuing_body: ext.issuing_body || null,
            }
          : {}

    return {
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim() || null,
      item_type: form.item_type,
      category_id: form.category_id,
      supplier_id: form.supplier_id || null,
      unit_of_measure: form.unit_of_measure,
      dispensing_unit: form.dispensing_unit || null,
      conversion_factor:
        form.conversion_factor === "" ? null : Number(form.conversion_factor),
      minimum_threshold: Number(form.minimum_threshold || 0),
      reorder_quantity:
        form.reorder_quantity === "" ? null : Number(form.reorder_quantity),
      max_stock_level:
        form.max_stock_level === "" ? null : Number(form.max_stock_level),
      unit_price:
        form.unit_price === "" ? null : Number(form.unit_price),
      hazard_class: isChemical ? (form.hazard_class || null) : null,
      storage_condition: form.storage_condition.trim() || null,
      regulatory_notes: form.regulatory_notes.trim() || null,
      is_perishable: Boolean(form.is_perishable),
      extension_data,
    }
  }

  const submit = async () => {
    if (labRequired) {
      setError("Select a laboratory first before creating an item")
      return
    }

    const errs = validate()
    setFieldErrors(errs)

    if (Object.keys(errs).length > 0) {
      setError("Please correct the highlighted fields")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const created = await createItem(buildPayload())
      navigate(`/items/${created.id}`)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {labRequired && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4">
          <p className="font-medium text-sm mb-1">Select a laboratory first</p>
          <p className="text-sm">
            As Super Admin, you can only create items after choosing the target laboratory
            from the top bar.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Add Item</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Create a new inventory item and define its stock rules
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/items")}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={loading || labRequired}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              loading || labRequired
                ? "bg-blue-300 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            title={labRequired ? "Select a laboratory first" : "Create item"}
          >
            {loading ? "Saving..." : "Save Item"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Field label="Item name" required error={fieldErrors.name}>
              <Input
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. Hydrochloric Acid 37%"
              />
            </Field>

            <Field label="SKU" required error={fieldErrors.sku}>
              <Input
                value={form.sku}
                onChange={set("sku")}
                placeholder="e.g. CHEM-HCL-001"
              />
            </Field>

            <Field label="Barcode">
              <Input
                value={form.barcode}
                onChange={set("barcode")}
                placeholder="Barcode number"
              />
            </Field>

            <Field label="Item type" required error={fieldErrors.item_type}>
              <Select
                value={form.item_type}
                onChange={set("item_type")}
                options={ITEM_TYPES}
              />
            </Field>

            <Field label="Category" required error={fieldErrors.category_id}>
              <Select
                value={form.category_id}
                onChange={set("category_id")}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select category"
              />
            </Field>

            <Field label="Storage condition">
              <Input
                value={form.storage_condition}
                onChange={set("storage_condition")}
                placeholder="e.g. Room temperature / Refrigerated"
              />
            </Field>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Unit & Stock Rules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Field label="Stock unit" required error={fieldErrors.unit_of_measure}>
              <Select
                value={form.unit_of_measure}
                onChange={set("unit_of_measure")}
                options={UNITS}
              />
            </Field>

            <Field
              label="Dispensing unit"
              error={fieldErrors.dispensing_unit}
              hint="Optional. Use when stock is received in one unit and issued in another."
            >
              <Select
                value={form.dispensing_unit}
                onChange={set("dispensing_unit")}
                options={UNITS}
                placeholder="Same as stock unit"
              />
            </Field>

            <Field
              label="Conversion factor"
              error={fieldErrors.conversion_factor}
              hint={
                usesDualUnit
                  ? `1 ${form.unit_of_measure} = ${form.conversion_factor} ${form.dispensing_unit}`
                  : "Number of dispensing units per stock unit"
              }
            >
              <Input
                type="number"
                min="0"
                step="any"
                value={form.conversion_factor}
                onChange={set("conversion_factor")}
                placeholder="e.g. 2500"
              />
            </Field>

            <Field label="Minimum threshold" required error={fieldErrors.minimum_threshold}>
              <Input
                type="number"
                min="0"
                step="any"
                value={form.minimum_threshold}
                onChange={set("minimum_threshold")}
                placeholder="e.g. 5"
              />
            </Field>

            <Field label="Reorder quantity" error={fieldErrors.reorder_quantity}>
              <Input
                type="number"
                min="0"
                step="any"
                value={form.reorder_quantity}
                onChange={set("reorder_quantity")}
                placeholder="e.g. 10"
              />
            </Field>

            <Field label="Maximum stock level" error={fieldErrors.max_stock_level}>
              <Input
                type="number"
                min="0"
                step="any"
                value={form.max_stock_level}
                onChange={set("max_stock_level")}
                placeholder="e.g. 50"
              />
            </Field>

            <Field label="Unit price" error={fieldErrors.unit_price}>
              <Input
                type="number"
                min="0"
                step="any"
                value={form.unit_price}
                onChange={set("unit_price")}
                placeholder="e.g. 25000"
              />
            </Field>

            <Field label="Perishable">
              <label className="inline-flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={form.is_perishable}
                  onChange={set("is_perishable")}
                />
                <span className="text-sm text-gray-700">
                  This item can expire or degrade over time
                </span>
              </label>
            </Field>

            {isChemical && (
              <Field label="Hazard class" required error={fieldErrors.hazard_class}>
                <Select
                  value={form.hazard_class}
                  onChange={set("hazard_class")}
                  options={HAZARD_CLASSES}
                  placeholder="Select hazard class"
                />
              </Field>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Notes & Compliance</h3>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Regulatory notes">
              <textarea
                value={form.regulatory_notes}
                onChange={set("regulatory_notes")}
                rows={4}
                placeholder="Any regulatory, licensing, compliance, or handling notes"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </Field>
          </div>
        </div>

        {isChemical && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Chemical Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <Field label="Formula">
                <Input value={ext.formula} onChange={setE("formula")} placeholder="e.g. HCl" />
              </Field>

              <Field label="CAS number">
                <Input value={ext.cas_number} onChange={setE("cas_number")} placeholder="e.g. 7647-01-0" />
              </Field>

              <Field label="Molecular weight">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={ext.molecular_weight}
                  onChange={setE("molecular_weight")}
                  placeholder="e.g. 36.46"
                />
              </Field>

              <Field label="MSDS URL">
                <Input value={ext.msds_url} onChange={setE("msds_url")} placeholder="https://..." />
              </Field>

              <Field label="PubChem ID">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={ext.pubchem_id}
                  onChange={setE("pubchem_id")}
                  placeholder="e.g. 313"
                />
              </Field>

              <Field label="GHS classification">
                <Input
                  value={ext.ghp_classification}
                  onChange={setE("ghp_classification")}
                  placeholder="e.g. Skin Corr. 1B"
                />
              </Field>
            </div>
          </div>
        )}

        {isEquipment && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Equipment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <Field label="Model number">
                <Input value={ext.model_number} onChange={setE("model_number")} placeholder="Model number" />
              </Field>

              <Field label="Serial number">
                <Input value={ext.serial_number} onChange={setE("serial_number")} placeholder="Serial number" />
              </Field>

              <Field
                label="Maintenance interval (days)"
                required
                error={fieldErrors.maintenance_interval_days}
              >
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={ext.maintenance_interval_days}
                  onChange={setE("maintenance_interval_days")}
                  placeholder="e.g. 90"
                />
              </Field>

              <Field label="Last maintenance date">
                <Input
                  type="date"
                  value={ext.last_maintenance_date}
                  onChange={setE("last_maintenance_date")}
                />
              </Field>

              <Field label="Warranty expiry">
                <Input
                  type="date"
                  value={ext.warranty_expiry}
                  onChange={setE("warranty_expiry")}
                />
              </Field>
            </div>
          </div>
        )}

        {isCRM && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Reference Material Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <Field label="Certification number">
                <Input
                  value={ext.certification_number}
                  onChange={setE("certification_number")}
                  placeholder="Certification number"
                />
              </Field>

              <Field
                label="Certification expiry"
                required
                error={fieldErrors.certification_expiry}
              >
                <Input
                  type="date"
                  value={ext.certification_expiry}
                  onChange={setE("certification_expiry")}
                />
              </Field>

              <Field label="Issuing body">
                <Input
                  value={ext.issuing_body}
                  onChange={setE("issuing_body")}
                  placeholder="Issuing body"
                />
              </Field>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}