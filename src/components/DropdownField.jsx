import {
  CheckIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import { useEffect, useId, useRef, useState } from 'react'

const iconProps = {
  className: 'editable-field-icon',
  width: 16,
  height: 16,
  'aria-hidden': true,
}

function formatDisplayValue(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  return value
}

function valuesAreEqual(currentValue, nextValue) {
  return String(currentValue ?? '') === String(nextValue ?? '')
}

function resolveDisplayValue(value, displayValue, options, fallback) {
  if (displayValue !== undefined && displayValue !== null && displayValue !== '') {
    return formatDisplayValue(displayValue, fallback)
  }

  const matchedOption = options.find((option) =>
    valuesAreEqual(option.value, value),
  )

  if (matchedOption) {
    return formatDisplayValue(matchedOption.label, fallback)
  }

  return formatDisplayValue(value, fallback)
}

export default function DropdownField({
  value = '',
  displayValue,
  options = [],
  onSave,
  label,
  fallback = '—',
  placeholder = '',
  disabled = false,
  editAtLabel = false,
  fontSizePx,
  editLabel = 'Edit',
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
}) {
  const labelId = useId()
  const selectRef = useRef(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEditing) {
      selectRef.current?.focus()
    }
  }, [isEditing])

  function startEditing() {
    setDraftValue(value ?? '')
    setError('')
    setIsEditing(true)
  }

  function cancelEditing() {
    setDraftValue(value ?? '')
    setError('')
    setIsEditing(false)
  }

  async function saveChanges() {
    if (saving || !onSave) {
      return
    }

    if (valuesAreEqual(value, draftValue)) {
      setIsEditing(false)
      return
    }

    setSaving(true)
    setError('')

    try {
      await onSave(draftValue)
      setIsEditing(false)
    } catch (saveError) {
      setError(saveError?.message ?? 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  function handleSelectKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      saveChanges()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      cancelEditing()
    }
  }

  const shownValue = resolveDisplayValue(value, displayValue, options, fallback)
  const textStyle = fontSizePx ? { fontSize: `${fontSizePx}px` } : undefined
  const fieldClassName = [
    'editable-field',
    'dropdown-field',
    editAtLabel ? 'editable-field-edit-at-label' : '',
    label ? '' : 'editable-field-no-label',
  ]
    .filter(Boolean)
    .join(' ')

  function renderEditButton() {
    if (disabled) {
      return null
    }

    return (
      <button
        type="button"
        className="editable-field-action editable-field-action-edit"
        aria-label={`${editLabel} ${label ?? shownValue}`}
        title={editLabel}
        onClick={startEditing}
      >
        <PencilIcon {...iconProps} />
      </button>
    )
  }

  return (
    <div className={fieldClassName}>
      {editAtLabel && label && !isEditing ? (
        <div className="editable-field-label-row">
          <span className="editable-field-label" id={labelId}>
            {label}
          </span>
          {renderEditButton()}
        </div>
      ) : label ? (
        <span className="editable-field-label" id={labelId}>
          {label}
        </span>
      ) : null}

      {isEditing ? (
        <div
          className="editable-field-edit"
          aria-labelledby={label ? labelId : undefined}
        >
          <select
            ref={selectRef}
            className="editable-field-input dropdown-field-select"
            style={textStyle}
            value={String(draftValue ?? '')}
            aria-labelledby={label ? labelId : undefined}
            aria-label={label ? undefined : editLabel}
            disabled={saving}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${labelId}-error` : undefined}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={handleSelectKeyDown}
          >
            {placeholder ? (
              <option value="">{placeholder}</option>
            ) : null}
            {options.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="editable-field-actions">
            <button
              type="button"
              className="editable-field-action editable-field-action-save"
              aria-label={saveLabel}
              title={saveLabel}
              disabled={saving}
              onClick={saveChanges}
            >
              <CheckIcon {...iconProps} />
            </button>
            <button
              type="button"
              className="editable-field-action editable-field-action-cancel"
              aria-label={cancelLabel}
              title={cancelLabel}
              disabled={saving}
              onClick={cancelEditing}
            >
              <XMarkIcon {...iconProps} />
            </button>
          </div>
          {error ? (
            <p
              className="editable-field-error"
              id={`${labelId}-error`}
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {saving ? (
            <p className="editable-field-status" role="status">
              Saving…
            </p>
          ) : null}
        </div>
      ) : (
        <div
          className="editable-field-display"
          aria-labelledby={label ? labelId : undefined}
        >
          <span className="editable-field-value" style={textStyle}>
            {shownValue}
          </span>
          {!(editAtLabel && label) ? renderEditButton() : null}
        </div>
      )}
    </div>
  )
}
