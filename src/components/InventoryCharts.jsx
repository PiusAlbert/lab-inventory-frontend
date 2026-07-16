import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts"

const PALETTE = [
  "#2563eb", "#059669", "#d97706",
  "#7c3aed", "#dc2626", "#0891b2",
  "#db2777", "#65a30d",
]

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-gray-800">{label}</p>
      <p className="text-gray-500">
        Qty: <span className="font-medium">{payload[0].value.toLocaleString()}</span>
      </p>
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-gray-800">{payload[0].name}</p>
      <p className="text-gray-500">
        {payload[0].value.toLocaleString()} units
        <span className="ml-1 text-gray-400">({payload[0].payload.pct}%)</span>
      </p>
    </div>
  )
}

export default function InventoryCharts({ data = null }) {

  if (data === null) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-semibold mb-4">Stock by category</h3>
        <div className="h-[260px] bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-semibold mb-4">Stock by category</h3>
        <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">
          No stock data available for this lab
        </div>
      </div>
    )
  }

  const total = data.reduce((s, d) => s + (d.total_quantity || 0), 0)
  const pieData = data.map((d, i) => ({
    name:  d.category,
    value: d.total_quantity || 0,
    pct:   total > 0 ? Math.round(((d.total_quantity || 0) / total) * 100) : 0,
    fill:  PALETTE[i % PALETTE.length],
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">Stock by category</h3>
          <p className="text-xs text-gray-400 mt-0.5">Total quantity on hand per category</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">

        {/* Bar chart — takes 3/5 on wide screens */}
        <div className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 36 }}>
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
              <Tooltip content={<BarTooltip />} cursor={{ fill: "#f9fafb" }} />
              <Bar dataKey="total_quantity" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — takes 2/5 on wide screens */}
        <div className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {data.map((item, i) => (
          <div key={item.category} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span
              className="inline-block w-2 h-2 rounded-sm flex-shrink-0"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            {item.category}
          </div>
        ))}
      </div>

    </div>
  )
}
