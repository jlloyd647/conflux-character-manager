import { useReferenceDataStore } from '../stores/referenceDataStore'

/** @param {number | string | null | undefined} rowStatusID */
export function useRowStatusName(rowStatusID) {
  const rowStatuses = useReferenceDataStore((state) => state.rowStatuses)

  if (rowStatusID === null || rowStatusID === undefined || rowStatusID === '') {
    return '—'
  }

  const status = rowStatuses.find(
    (entry) => entry.rowStatusID === Number(rowStatusID),
  )

  return status?.statusName ?? '—'
}
