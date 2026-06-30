import { generatePath, useNavigate } from 'react-router-dom'

const DEFAULT_FALLBACK = '—'

function buildRowPath(link, linkId, row) {
  if (!link || !linkId) {
    return null
  }

  const id = row[linkId]

  if (id === null || id === undefined || id === '') {
    return null
  }

  const paramName = link.match(/:([^/]+)/)?.[1]

  if (!paramName) {
    return link
  }

  return generatePath(link, { [paramName]: String(id) })
}

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

function getCellValue(row, column, fallback) {
  const value = row[column.key]

  if (value === null || value === undefined || value === '') {
    return fallback
  }

  if (column.format) {
    const formatted = column.format(value, row)

    if (formatted === null || formatted === undefined || formatted === '') {
      return fallback
    }

    return formatted
  }

  return value
}

export default function DataTable({
  data = [],
  columns,
  emptyMessage = 'No data to display.',
  fallback = DEFAULT_FALLBACK,
  link,
  linkId,
  onRowClick,
}) {
  const navigate = useNavigate()
  const resolvedColumns = resolveColumns(data, columns)
  const isRowClickable = Boolean(onRowClick || (link && linkId))

  function handleRowActivate(row) {
    if (onRowClick) {
      onRowClick(row)
      return
    }

    const path = buildRowPath(link, linkId, row)

    if (path) {
      navigate(path)
    }
  }

  function handleRowKeyDown(event, row) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleRowActivate(row)
    }
  }

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
              <tr
                key={row.id ?? row.skillID ?? rowIndex}
                className={isRowClickable ? 'data-table-row-clickable' : undefined}
                onClick={isRowClickable ? () => handleRowActivate(row) : undefined}
                onKeyDown={isRowClickable ? (event) => handleRowKeyDown(event, row) : undefined}
                tabIndex={isRowClickable ? 0 : undefined}
                role={isRowClickable ? 'button' : undefined}
              >
                {resolvedColumns.map((column) => (
                  <td key={column.key}>
                    {getCellValue(row, column, column.fallback ?? fallback)}
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
