import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell
} from "recharts"

const BAR_COLORS = [
  "#2563eb", "#059669", "#d97706",
  "#7c3aed", "#dc2626", "#0891b2",
  "#db2777", "#65a30d"
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-gray-800">{label}</p>
      <p className="text-gray-500">Qty: <span className="font-medium">{payload[0].value.toLocaleString()}</span></p>
    </div>
  )
}

export default function InventoryCharts({ data = null }) {

  if (data === null) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-base font-semibold mb-4">Stock by category</h3>
        <div className="h-[260px] bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-base font-semibold mb-4">Stock by category</h3>
        <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">
          No stock data available for this lab
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">Stock by category</h3>
          <p className="text-xs text-gray-400 mt-0.5">Total quantity on hand per category</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
          <XAxis
            dataKey="category"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
          <Bar dataKey="total_quantity" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-3 mt-1">
        {data.map((item, index) => (
          <div key={item.category} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span
              className="inline-block w-2 h-2 rounded-sm flex-shrink-0"
              style={{ background: BAR_COLORS[index % BAR_COLORS.length] }}
            />
            {item.category}
          </div>
        ))}
      </div>

    </div>
  )
}