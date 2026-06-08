import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthFormCard from '../components/AuthFormCard'
import { useAuth } from '../hooks/useAuth'
import { logout, updatePassword } from '../services/authService'

function hasRecoveryToken() {
  const hash = window.location.hash.slice(1)

  if (!hash) {
    return false
  }

  const params = new URLSearchParams(hash)
  return params.get('type') === 'recovery' || Boolean(params.get('access_token'))
}

function getVerificationState(authLoading, isAuthenticated, recoveryTimedOut) {
  if (authLoading) {
    return 'checking'
  }

  if (isAuthenticated) {
    return 'ready'
  }

  if (hasRecoveryToken() && !recoveryTimedOut) {
    return 'checking'
  }

  return 'invalid'
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [recoveryTimedOut, setRecoveryTimedOut] = useState(false)

  useEffect(() => {
    if (authLoading || isAuthenticated || !hasRecoveryToken()) {
      return
    }

    const timer = window.setTimeout(() => {
      setRecoveryTimedOut(true)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [authLoading, isAuthenticated])

  const verificationState = getVerificationState(authLoading, isAuthenticated, recoveryTimedOut)

  function validateForm() {
    const errors = {}

    if (!password) {
      errors.password = 'Password is required.'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.'
    }

    if (!passwordConfirmation) {
      errors.passwordConfirmation = 'Please confirm your password.'
    } else if (password !== passwordConfirmation) {
      errors.passwordConfirmation = 'Passwords do not match.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      await updatePassword({ password })
      await logout()
      navigate('/login', {
        replace: true,
        state: { passwordReset: true },
      })
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (verificationState === 'checking') {
    return (
      <AuthFormCard title="Reset password" subtitle="Verifying your reset link…">
        <p className="auth-form-subtitle">Please wait while we confirm your reset link.</p>
      </AuthFormCard>
    )
  }

  if (verificationState === 'invalid') {
    return (
      <AuthFormCard title="Reset password" subtitle="This reset link is no longer valid">
        <p className="auth-form-error" role="alert">
          Your reset link is invalid or has expired. Please request a new one.
        </p>
        <p className="auth-form-footer">
          <Link className="auth-form-link" to="/forgot-password">
            Request a new reset link
          </Link>
        </p>
      </AuthFormCard>
    )
  }

  return (
    <AuthFormCard title="Reset password" subtitle="Choose a new password for your account">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {submitError ? (
          <p className="auth-form-error" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="auth-form-field">
          <label className="auth-form-label" htmlFor="reset-password">
            New password
          </label>
          <input
            id="reset-password"
            className="auth-form-input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'reset-password-error' : undefined}
          />
          {fieldErrors.password ? (
            <p className="auth-form-field-error" id="reset-password-error" role="alert">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div className="auth-form-field">
          <label className="auth-form-label" htmlFor="reset-password-confirmation">
            Confirm new password
          </label>
          <input
            id="reset-password-confirmation"
            className="auth-form-input"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            aria-invalid={Boolean(fieldErrors.passwordConfirmation)}
            aria-describedby={
              fieldErrors.passwordConfirmation ? 'reset-password-confirmation-error' : undefined
            }
          />
          {fieldErrors.passwordConfirmation ? (
            <p
              className="auth-form-field-error"
              id="reset-password-confirmation-error"
              role="alert"
            >
              {fieldErrors.passwordConfirmation}
            </p>
          ) : null}
        </div>

        <button className="auth-form-submit" type="submit" disabled={submitting}>
          {submitting ? 'Updating password…' : 'Update password'}
        </button>
      </form>

      <p className="auth-form-footer">
        <Link className="auth-form-link" to="/login">
          Back to sign in
        </Link>
      </p>
    </AuthFormCard>
  )
}
