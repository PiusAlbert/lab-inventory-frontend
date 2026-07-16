/**
 * columns: Array<{ label: string, value: (row: T) => string | number | null }>
 */
export function exportCSV(filename, columns, rows) {
  const escape = (v) => {
    if (v == null) return ''
    const s = String(v).replace(/"/g, '""')
    return s.search(/[,"\n\r]/) >= 0 ? `"${s}"` : s
  }
  const lines = [
    columns.map(c => escape(c.label)).join(','),
    ...rows.map(row => columns.map(c => escape(c.value(row))).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
