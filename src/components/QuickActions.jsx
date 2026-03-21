/**
 * QuickActions
 *
 * Renders a row of shortcut cards for the four most common lab operations.
 *
 * Props:
 *   onAddItem     — navigate to add item page / open modal
 *   onReceive     — open receive stock modal
 *   onIssue       — open issue stock modal
 *   onLowStock    — navigate to low stock filtered items list
 */

const ACTION_ICON_BASE = "w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"

const actions = (props) => [
  {
    icon:    "＋",
    iconBg:  "bg-blue-50 text-blue-600",
    label:   "Add new item",
    desc:    "Register a new inventory item",
    onClick: props.onAddItem,
  },
  {
    icon:    "↓",
    iconBg:  "bg-green-50 text-green-700",
    label:   "Receive stock",
    desc:    "Log an incoming batch delivery",
    onClick: props.onReceive,
  },
  {
    icon:    "↑",
    iconBg:  "bg-amber-50 text-amber-700",
    label:   "Issue stock",
    desc:    "Dispense items to a requester",
    onClick: props.onIssue,
  },
  {
    icon:    "⚠",
    iconBg:  "bg-red-50 text-red-600",
    label:   "Low stock items",
    desc:    "Review items needing reorder",
    onClick: props.onLowStock,
  },
]

export default function QuickActions(props) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Quick actions
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions(props).map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="bg-white shadow rounded-lg p-4 flex items-start gap-3
                       text-left hover:shadow-md transition-shadow cursor-pointer
                       border border-transparent hover:border-gray-100 w-full"
          >
            <div className={`${ACTION_ICON_BASE} ${action.iconBg}`}>
              {action.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 leading-snug">
                {action.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                {action.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}