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

export default function EditableField({
  value = '',
  onSave,
  label,
  fallback = '—',
  placeholder = '',
  disabled = false,
  inputType = 'text',
  editLabel = 'Edit',
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
}) {
  const labelId = useId()
  const inputRef = useRef(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(value ?? '')
    }
  }, [value, isEditing])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
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

  function handleInputKeyDown(event) {
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

  const shownValue = formatDisplayValue(value, fallback)

  return (
    <div className="editable-field">
      {label ? (
        <span className="editable-field-label" id={labelId}>
          {label}
        </span>
      ) : null}

      {isEditing ? (
        <div
          className="editable-field-edit"
          aria-labelledby={label ? labelId : undefined}
        >
          <input
            ref={inputRef}
            className="editable-field-input"
            type={inputType}
            value={draftValue}
            placeholder={placeholder}
            disabled={saving}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${labelId}-error` : undefined}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
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
          <span className="editable-field-value">{shownValue}</span>
          {!disabled ? (
            <button
              type="button"
              className="editable-field-action editable-field-action-edit"
              aria-label={`${editLabel} ${label ?? shownValue}`}
              title={editLabel}
              onClick={startEditing}
            >
              <PencilIcon {...iconProps} />
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
