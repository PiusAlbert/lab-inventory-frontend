/**
 * DashboardCard
 *
 * Props:
 *   title    — string label above the value
 *   value    — primary metric to display
 *   subtitle — optional muted line below the value
 *   variant  — "default" | "danger" | "warning" | "success"
 *   onClick  — optional callback; renders a "View →" button when provided
 */

const VARIANT_STYLES = {
  default: {
    value: "text-gray-900",
    btn:   "text-blue-600 hover:text-blue-800",
  },
  danger: {
    value: "text-red-600",
    btn:   "text-red-500 hover:text-red-700",
  },
  warning: {
    value: "text-amber-600",
    btn:   "text-amber-500 hover:text-amber-700",
  },
  success: {
    value: "text-green-600",
    btn:   "text-green-500 hover:text-green-700",
  },
}

const DashboardCard = ({
  title,
  value,
  subtitle,
  variant = "default",
  onClick,
}) => {

  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.default

  return (
    <div className="bg-white shadow rounded-lg p-5 relative">

      <p className="text-sm text-gray-500 mb-1">
        {title}
      </p>

      <h2 className={`text-3xl font-bold ${styles.value}`}>
        {value}
      </h2>

      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">
          {subtitle}
        </p>
      )}

      {onClick && (
        <button
          onClick={onClick}
          className={`absolute top-4 right-4 text-xs font-medium ${styles.btn} transition-colors`}
        >
          View →
        </button>
      )}

    </div>
  )
}

export default DashboardCard