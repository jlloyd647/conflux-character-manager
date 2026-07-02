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
  onDecrease,
  onIncrease,
  label,
  min,
  max,
  step = 1,
  isEditing = false,
  disabled = false,
  hideDecrease = false,
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
  const currentForAdjust = activeNumber ?? toNumber(min) ?? 0
  const canAdjust = isEditing && !disabled && onChange
  const canDecrease =
    canAdjust &&
    !hideDecrease &&
    (onDecrease || activeNumber !== null) &&
    (min === undefined || min === null || currentForAdjust > min)
  const canIncrease =
    canAdjust &&
    (onIncrease || activeNumber !== null) &&
    (max === undefined || max === null || currentForAdjust < max)

  function resolveNextValue(direction) {
    if (!canAdjust) {
      return null
    }

    const customHandler = direction < 0 ? onDecrease : onIncrease

    if (customHandler) {
      const result = customHandler(currentForAdjust)

      if (!Number.isFinite(result)) {
        return null
      }

      return clampValue(result, min, max)
    }

    if (activeNumber === null) {
      return null
    }

    const adjustment = Number(step)

    if (!Number.isFinite(adjustment) || adjustment <= 0) {
      return null
    }

    return clampValue(
      activeNumber + direction * adjustment,
      min,
      max,
    )
  }

  function handleDecrease() {
    const nextValue = resolveNextValue(-1)

    if (nextValue === null) {
      return
    }

    onChange(nextValue)
  }

  function handleIncrease() {
    const nextValue = resolveNextValue(1)

    if (nextValue === null) {
      return
    }

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
          {!hideDecrease ? (
            <button
              type="button"
              className="editable-field-action numeric-field-action"
              aria-label={`${decreaseLabel} ${label ?? shownValue}`}
              title={decreaseLabel}
              disabled={!canDecrease}
              onClick={handleDecrease}
            >
              <MinusIcon {...iconProps} />
            </button>
          ) : null}
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
            onClick={handleIncrease}
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
