export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null

  const { page, pages, total, limit } = pagination
  const from = (page - 1) * limit + 1
  const to   = Math.min(page * limit, total)

  const windowSize = Math.min(5, pages)
  let start = Math.max(1, page - Math.floor(windowSize / 2))
  let end   = start + windowSize - 1
  if (end > pages) { end = pages; start = Math.max(1, end - windowSize + 1) }
  const pageNums = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const btn = "px-2.5 py-1 border rounded text-xs transition-colors"

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
      <span>Showing {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`${btn} border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          ← Prev
        </button>
        {start > 1 && <span className="px-1 text-gray-300">…</span>}
        {pageNums.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btn} ${
              p === page
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}
        {end < pages && <span className="px-1 text-gray-300">…</span>}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className={`${btn} border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
