const VARIANT_STYLES = {
  default: {
    value: "text-gray-900",
    indicator: "text-blue-500",
  },
  danger: {
    value: "text-red-600",
    indicator: "text-red-400",
  },
  warning: {
    value: "text-amber-600",
    indicator: "text-amber-400",
  },
  success: {
    value: "text-green-600",
    indicator: "text-green-500",
  },
}

export default function DashboardCard({
  title,
  value,
  subtitle,
  variant = "default",
  onClick,
}) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.default

  return (
    <div
      onClick={onClick}
      className={[
        "bg-white border border-gray-100 shadow-sm rounded-lg p-5 relative",
        onClick ? "cursor-pointer hover:shadow-md hover:border-gray-200 transition-all select-none" : "",
      ].join(" ")}
    >
      <p className="text-sm text-gray-500 mb-1">{title}</p>

      <h2 className={`text-3xl font-bold ${styles.value}`}>{value}</h2>

      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}

      {onClick && (
        <span className={`absolute top-4 right-4 text-xs font-medium ${styles.indicator}`}>
          View →
        </span>
      )}
    </div>
  )
}
