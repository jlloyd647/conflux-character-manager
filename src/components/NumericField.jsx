import { MinusIcon, PlusIcon } from '@heroicons/react/16/solid'
import { useId } from 'react'

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

function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function clampValue(value, min, max) {
  let nextValue = value

  if (min !== undefined && min !== null && nextValue < min) {
    nextValue = min
  }

  if (max !== undefined && max !== null && nextValue > max) {
    nextValue = max
  }

  return nextValue
}

export default function NumericField({
  value,
  draftValue,
  onChange,
  label,
  min,
  max,
  step = 1,
  isEditing = false,
  disabled = false,
  fallback = '—',
  fontSizePx,
  decreaseLabel = 'Decrease',
  increaseLabel = 'Increase',
}) {
  const labelId = useId()
  const textStyle = fontSizePx ? { fontSize: `${fontSizePx}px` } : undefined
  const fieldClassName = [
    'editable-field',
    'numeric-field',
    label ? '' : 'editable-field-no-label',
  ]
    .filter(Boolean)
    .join(' ')

  const shownValue = formatDisplayValue(value, fallback)
  const activeValue = isEditing
    ? (draftValue !== undefined ? draftValue : value)
    : value
  const activeNumber = toNumber(activeValue)
  const canAdjust = isEditing && !disabled && onChange
  const canDecrease =
    canAdjust &&
    activeNumber !== null &&
    (min === undefined || min === null || activeNumber > min)
  const canIncrease =
    canAdjust &&
    activeNumber !== null &&
    (max === undefined || max === null || activeNumber < max)

  function adjustValue(direction) {
    if (!canAdjust || activeNumber === null) {
      return
    }

    const nextValue = clampValue(
      activeNumber + direction * step,
      min,
      max,
    )
    onChange(nextValue)
  }

  return (
    <div className={fieldClassName}>
      {label ? (
        <span className="editable-field-label" id={labelId}>
          {label}
        </span>
      ) : null}

      {isEditing ? (
        <div
          className="editable-field-edit numeric-field-edit"
          aria-labelledby={label ? labelId : undefined}
        >
          <button
            type="button"
            className="editable-field-action numeric-field-action"
            aria-label={`${decreaseLabel} ${label ?? shownValue}`}
            title={decreaseLabel}
            disabled={!canDecrease}
            onClick={() => adjustValue(-1)}
          >
            <MinusIcon {...iconProps} />
          </button>
          <span
            className="editable-field-input numeric-field-value"
            style={textStyle}
            aria-labelledby={label ? labelId : undefined}
            aria-label={label ? undefined : 'Numeric value'}
            role="textbox"
            aria-readonly="true"
          >
            {formatDisplayValue(activeValue, fallback)}
          </span>
          <button
            type="button"
            className="editable-field-action numeric-field-action"
            aria-label={`${increaseLabel} ${label ?? shownValue}`}
            title={increaseLabel}
            disabled={!canIncrease}
            onClick={() => adjustValue(1)}
          >
            <PlusIcon {...iconProps} />
          </button>
        </div>
      ) : (
        <div
          className="editable-field-display numeric-field-display"
          aria-labelledby={label ? labelId : undefined}
        >
          <span
            className="editable-field-input numeric-field-value"
            style={textStyle}
          >
            {shownValue}
          </span>
        </div>
      )}
    </div>
  )
}
