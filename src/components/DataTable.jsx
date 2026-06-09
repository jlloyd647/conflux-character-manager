const DEFAULT_FALLBACK = '—'

function formatHeader(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function resolveColumns(data, columns) {
  if (columns?.length) {
    return columns
  }

  if (!data?.length) {
    return []
  }

  return Object.keys(data[0]).map((key) => ({
    key,
    header: formatHeader(key),
  }))
}

function getCellValue(row, key, fallback) {
  const value = row[key]

  if (value === null || value === undefined || value === '') {
    return fallback
  }

  return value
}

export default function DataTable({
  data = [],
  columns,
  emptyMessage = 'No data to display.',
  fallback = DEFAULT_FALLBACK,
}) {
  const resolvedColumns = resolveColumns(data, columns)

  if (!resolvedColumns.length) {
    return (
      <div className="data-table-empty" role="status">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead className="data-table-head">
          <tr>
            {resolvedColumns.map((column) => (
              <th key={column.key} scope="col">
                {column.header ?? formatHeader(column.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="data-table-body">
          {data.length === 0 ? (
            <tr>
              <td className="data-table-empty-cell" colSpan={resolvedColumns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row.id ?? rowIndex}>
                {resolvedColumns.map((column) => (
                  <td key={column.key}>
                    {getCellValue(row, column.key, column.fallback ?? fallback)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
